import type { IncidentTypeType, PulseType, UserType } from "@server/db/schema";
import { notificationRepository } from "@server/repositories/NotificationRepository";
import {
	type PulseRepository,
	pulseRepository,
} from "@server/repositories/PulseRepository";
import {
	type ResponseRepository,
	responseRepository,
} from "@server/repositories/ResponseRepository";
import { skillRepository } from "@server/repositories/SkillRepository";
import type {
	PulseConditionOptions,
	PulseSearchOptions,
} from "@server/repositories/types";
import {
	type UserRepository,
	userRepository,
} from "@server/repositories/UserRepository";
import { ClusteringService } from "@server/services/ClusterigService";
import { cacheManager } from "@server/services/cache/CacheManager";
import { notificationService } from "@server/services/NotificationService";
import { requestMatchingAIService } from "@server/services/RequestMatchingAIService";
import type { Last7DaysPulseCounts } from "@server/services/types";
import { handleError } from "@server/utils/handleError";
import {
	PulseEnum,
	PulseStatusEnum,
	PulseUploadStateEnum,
} from "@shared/types";
import type { PulseRetrievePayloadType } from "@shared/validators/pulses/isPulseRetrieveValid";
import {
	type PulseSocketMessageType,
	pulseSocketMessageSchema,
} from "@shared/validators/pulses/isPulseSocketMessageValid";
import type { PulseUpdateBody } from "@shared/validators/pulses/isPulseUpdateValid";
import { incidentTypeService } from "./IncidentTypeService";

type PulseSocketResponse = {
	success: boolean;
	message: string;
	data: SerializedPulse | SerializedPulse[] | null;
};

type PulseViewerContext = Pick<UserType, "id" | "role"> | null;
type PulseAuthorPriority = Pick<
	UserType,
	"id" | "role" | "trustScore" | "isVerified"
>;
export type SerializedPulse = PulseType & {
	locationPrecision: "exact" | "approximate";
	incidentType: IncidentTypeType | null;
	authorRole: string | null;
	authorTrustScore: number | null;
	authorIsVerified: boolean | null;
};

/**
 * Service for managing Urban Pulse records and retrieving location-based pulses.
 */
export class PulseService {
	private pulseRepository: PulseRepository;
	responseRepository: ResponseRepository;
	private userRepository: UserRepository;
	private cache = cacheManager;

	constructor() {
		this.pulseRepository = pulseRepository;
		this.responseRepository = responseRepository;
		this.userRepository = userRepository;
	}

	private async invalidatePulseCaches(pulseId?: string) {
		await Promise.all([
			pulseId
				? this.cache.invalidate(pulseId, { namespace: "pulse" })
				: Promise.resolve(),
			this.cache.invalidatePattern("nearby:*", "pulse"),
			this.cache.invalidatePattern("*:matches", "heroAlert"),
			this.cache.invalidatePattern("overview:*", "dashboard"),
		]);
	}

	private extractPulseIdFromNotificationPayload(
		payload: unknown,
	): string | null {
		if (!payload || typeof payload !== "object" || !("pulseId" in payload)) {
			return null;
		}

		return typeof payload.pulseId === "string" ? payload.pulseId : null;
	}

	private dedupePulses(pulses: PulseType[]): PulseType[] {
		const unique = new Map<string, PulseType>();

		for (const pulse of pulses) {
			unique.set(pulse.id, pulse);
		}

		return Array.from(unique.values());
	}

	private canViewExactPulseLocation(
		pulse: PulseType,
		viewer: PulseViewerContext,
	) {
		if (!viewer) {
			return false;
		}

		return viewer.role === "admin" || viewer.id === pulse.userId;
	}

	private toApproximatePosition(position: PulseType["position"]) {
		const precision = 1000;
		return {
			x: Math.round(position.x * precision) / precision,
			y: Math.round(position.y * precision) / precision,
		};
	}

	private async getPulseIncidentType(pulse: PulseType) {
		if (!pulse.incidentTypeId) {
			return null;
		}

		return await incidentTypeService.getIncidentTypeById(pulse.incidentTypeId);
	}

	private toAuthorPriorityFields(author: PulseAuthorPriority | null) {
		return {
			authorRole: author?.role ?? null,
			authorTrustScore: author?.trustScore ?? null,
			authorIsVerified: author?.isVerified ?? null,
		};
	}

	private buildSerializedPulse(params: {
		pulse: PulseType;
		viewer: PulseViewerContext;
		incidentType: IncidentTypeType | null;
		author: PulseAuthorPriority | null;
	}): SerializedPulse {
		const { pulse, viewer, incidentType, author } = params;
		const authorFields = this.toAuthorPriorityFields(author);
		if (this.canViewExactPulseLocation(pulse, viewer)) {
			return {
				...pulse,
				incidentType,
				locationPrecision: "exact",
				...authorFields,
			};
		}

		return {
			...pulse,
			incidentType,
			position: this.toApproximatePosition(pulse.position),
			locationPrecision: "approximate",
			...authorFields,
		};
	}

	private async getPulseAuthorMap(pulses: PulseType[]) {
		const authors = await this.userRepository.getByIds(
			pulses.map((pulse) => pulse.userId),
		);

		return new Map(authors.map((author) => [author.id, author] as const));
	}

	async serializePulseForViewer(
		pulse: PulseType,
		viewer: PulseViewerContext,
	): Promise<SerializedPulse> {
		const [incidentType, author] = await Promise.all([
			this.getPulseIncidentType(pulse),
			this.userRepository.getOne(pulse.userId),
		]);

		return this.buildSerializedPulse({
			pulse,
			viewer,
			incidentType,
			author,
		});
	}

	async serializePulsesForViewer(
		pulses: PulseType[],
		viewer: PulseViewerContext,
	): Promise<SerializedPulse[]> {
		const authorMap = await this.getPulseAuthorMap(pulses);

		return Promise.all(
			pulses.map(async (pulse) =>
				this.buildSerializedPulse({
					pulse,
					viewer,
					incidentType: await this.getPulseIncidentType(pulse),
					author: authorMap.get(pulse.userId) ?? null,
				}),
			),
		);
	}

	/**
	 * Normalizes the provided date to UTC day start.
	 * @param {Date} date - Source date.
	 * @returns {Date} UTC day start.
	 */
	private startOfUtcDay(date: Date): Date {
		return new Date(
			Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
		);
	}

	/**
	 * Adds a number of days to a date.
	 * @param {Date} date - Base date.
	 * @param {number} days - Number of days to add.
	 * @returns {Date} Shifted date.
	 */
	private addDays(date: Date, days: number): Date {
		const DAY_MS = 24 * 60 * 60 * 1000;
		return new Date(date.getTime() + days * DAY_MS);
	}

	/**
	 * Retrieves pulses filtered by column options and optional createdAt condition.
	 * @param {PulseSearchOptions} options - Partial pulse filters.
	 * @param {PulseConditionOptions} [condition] - Optional createdAt range.
	 * @returns {Promise<PulseType[] | null>} Matching pulses or null on failure.
	 */
	async getPulsesByCondition(
		options: PulseSearchOptions,
		condition?: PulseConditionOptions,
	): Promise<PulseType[] | null> {
		try {
			return await this.pulseRepository.getByOptions(options, condition);
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	/**
	 * Counts pulses filtered by column options and optional createdAt condition.
	 * @param {PulseSearchOptions} options - Partial pulse filters.
	 * @param {PulseConditionOptions} [condition] - Optional createdAt range.
	 * @returns {Promise<number>} Number of matching pulses.
	 */
	async countPulsesByCondition(
		options: PulseSearchOptions,
		condition?: PulseConditionOptions,
	): Promise<number> {
		const pulses = await this.getPulsesByCondition(options, condition);
		return pulses?.length ?? 0;
	}

	/**
	 * Calculates pulse counts for current and previous 7-day windows.
	 * @param {PulseSearchOptions} options - Partial pulse filters.
	 * @param {Date} [referenceDate] - Date used to anchor the rolling windows.
	 * @returns {Promise<Last7DaysPulseCounts | null>} Current and previous window counts.
	 */
	async getPulseCountsForLast7Days(
		options: PulseSearchOptions,
		referenceDate: Date = new Date(),
	): Promise<Last7DaysPulseCounts | null> {
		try {
			const windowDays = 7;
			const todayStart = this.startOfUtcDay(referenceDate);
			const currentWindowStart = this.addDays(todayStart, -(windowDays - 1));
			const currentWindowEnd = this.addDays(todayStart, 1);
			const previousWindowStart = this.addDays(currentWindowStart, -windowDays);
			const previousWindowEnd = currentWindowStart;

			const [pulsesLast7Days, previousPulsesLast7Days] = await Promise.all([
				this.countPulsesByCondition(options, {
					createdAtFrom: currentWindowStart,
					createdAtTo: currentWindowEnd,
				}),
				this.countPulsesByCondition(options, {
					createdAtFrom: previousWindowStart,
					createdAtTo: previousWindowEnd,
				}),
			]);

			return {
				pulsesLast7Days,
				previousPulsesLast7Days,
				currentWindowStart,
				currentWindowEnd,
				previousWindowStart,
				previousWindowEnd,
			};
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	async getPulseById(id: string): Promise<PulseType | null> {
		return await this.cache.getOrSet(
			id,
			() => this.pulseRepository.getOne(id),
			{ namespace: "pulse", ttl: 300 },
		);
	}

	/**
	 * Creates a new Pulse in the database.
	 * @param {Partial<PulseType>} data - The pulse data.
	 * @returns {Promise<PulseType | null>} The created pulse.
	 */
	async createPulse(data: Partial<PulseType>): Promise<PulseType | null> {
		try {
			const title = data.title?.trim();
			const description = data.description?.trim() ?? "";
			let requestedSkillTags = data.requestedSkillTags ?? [];
			let matchMetadata = data.matchMetadata ?? {};
			const resolvedIncidentType =
				await incidentTypeService.resolveIncidentTypeIdForPulse(
					data.type ?? PulseEnum.Emergency,
					data.incidentTypeId,
				);

			if (!resolvedIncidentType.ok) {
				handleError(new Error(resolvedIncidentType.message));
				return null;
			}

			if (title) {
				const allowedTags = await skillRepository.getDistinctTags();
				const inferred = await requestMatchingAIService.inferSkillTags({
					title,
					description,
					allowedTags,
				});
				requestedSkillTags = inferred.tags;
				matchMetadata = {
					provider: inferred.provider,
					model: inferred.model,
					matchedKeywords: inferred.matchedKeywords,
					rawSuggestedTags: inferred.rawSuggestedTags ?? [],
					inferredAt: new Date().toISOString(),
				};
			}

			const created = await this.pulseRepository.create({
				...data,
				incidentTypeId: resolvedIncidentType.data.incidentTypeId,
				requestedSkillTags,
				matchMetadata,
				isVerified: false,
				mergedIntoPulseId: null,
				moderationNote: null,
			});
			if (created) {
				await this.invalidatePulseCaches(created.id);

				// adding the cluster creation
				try {
					const clusteringService = new ClusteringService();
					await clusteringService.findOrCreateCluster(created);
				} catch (error) {
					handleError(error);
				}
			}

			return created;
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	/**
	 * Updates an existing pulse's metadata or status.
	 * @param {string} pulseId - UUID of the pulse.
	 * @param {Partial<PulseType>} data - Fields to update.
	 * @returns {Promise<PulseType | null>} The updated pulse.
	 */
	async updatePulse(
		pulseId: string,
		data: Partial<PulseType>,
	): Promise<PulseType | null> {
		try {
			const updatedPulse = await this.pulseRepository.update(pulseId, data);
			await this.invalidatePulseCaches(pulseId);
			return updatedPulse;
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	/**
	 * Updates a pulse only if the caller owns it. Sets isResolved when status is Resolved.
	 */
	async updatePulseAsOwner(
		pulseId: string,
		ownerUserId: string,
		data: PulseUpdateBody,
	): Promise<PulseType | null> {
		try {
			const existing = await this.pulseRepository.getOne(pulseId);
			if (!existing || existing.userId !== ownerUserId) {
				return null;
			}
			const patch: Partial<PulseType> = { ...data };
			if (data.status === PulseStatusEnum.Resolved) {
				patch.isResolved = true;
			}
			const updatedPulse = await this.pulseRepository.update(pulseId, patch);
			await this.invalidatePulseCaches(pulseId);
			return updatedPulse;
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	/**
	 * Retrieves pulses within range of a specific user/location.
	 * @param {Object} params - Query parameters.
	 * @param {Object} params.position - Current coordinates {x: Long, y: Lat}.
	 * @returns {Promise<PulseType[] | null>} Array of matching pulses.
	 */
	async getPulses({
		position,
		radius = 500,
		status = PulseStatusEnum.Active,
		type,
		urgency,
		verifiedOnly,
	}: PulseRetrievePayloadType): Promise<PulseType[] | null> {
		const roundLat = Math.round(position.y * 100) / 100;
		const roundLng = Math.round(position.x * 100) / 100;
		const cacheKey = `nearby:${roundLat}:${roundLng}:${radius}:${status}:${type || "all"}:${urgency || "all"}`;

		return await this.cache.getOrSet(
			cacheKey,
			async () => {
				try {
					const pulses = await this.pulseRepository.getByOptions({
						x: position.x,
						y: position.y,
						radius,
						status,
						type,
						urgency,
						isVerified: verifiedOnly ? true : undefined,
					});

					return pulses.filter((pulse) => !pulse.mergedIntoPulseId);
				} catch (error) {
					handleError(error);
					return null;
				}
			},
			{ namespace: "pulse", ttl: 300 },
		);
	}

	async getMapPulses(
		viewer: NonNullable<PulseViewerContext>,
		payload: PulseRetrievePayloadType,
	): Promise<PulseType[] | null> {
		try {
			const [nearbyEmergencies, heroAlerts] = await Promise.all([
				this.getPulses({
					position: payload.position,
					radius: payload.radius,
					status: payload.status,
					type: payload.type,
				}),
				notificationRepository.getByOptions({
					userId: viewer.id,
					type: "HERO_ALERT",
				}),
			]);

			const matchedPulseIds = Array.from(
				new Set(
					heroAlerts
						.map((notification) =>
							this.extractPulseIdFromNotificationPayload(notification.payload),
						)
						.filter((pulseId): pulseId is string => Boolean(pulseId)),
				),
			);

			const matchedPulses = await Promise.all(
				matchedPulseIds.map(async (pulseId) => this.getPulseById(pulseId)),
			);

			return this.dedupePulses([
				...(nearbyEmergencies ?? []),
				...matchedPulses.filter(
					(pulse): pulse is PulseType =>
						pulse !== null &&
						!pulse.mergedIntoPulseId &&
						pulse.status === PulseStatusEnum.Active,
				),
			]);
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	async handleSocketMessage(
		message: unknown,
		viewer: PulseViewerContext,
	): Promise<PulseSocketResponse> {
		const result = pulseSocketMessageSchema.safeParse(message);
		if (!result.success) {
			return {
				success: false,
				message: "Invalid request",
				data: null,
			};
		}

		switch (result.data.type) {
			case "upload-pulse":
				return this.handleUploadPulseMessage(result.data, viewer);
			case "get-pulses":
				return this.handleGetPulsesMessage(result.data.payload, viewer);
			case "get-map-pulses":
				return this.handleGetMapPulsesMessage(result.data.payload, viewer);
		}
	}

	private async handleUploadPulseMessage(
		message: Extract<PulseSocketMessageType, { type: "upload-pulse" }>,
		viewer: PulseViewerContext,
	): Promise<PulseSocketResponse> {
		if (!viewer) {
			return {
				success: false,
				message: "Unauthorized",
				data: null,
			};
		}

		const newPulse = await this.createPulse({
			...message.payload,
			userId: viewer.id,
		});
		if (!newPulse) {
			return {
				success: false,
				message: "Failed to create pulse",
				data: null,
			};
		}

		const uploadedPulse = await this.updatePulse(newPulse.id, {
			pulseUploadState: PulseUploadStateEnum.Uploaded,
		});

		if (!uploadedPulse) {
			return {
				success: false,
				message: "Failed to update pulse upload state",
				data: null,
			};
		}

		await notificationService.broadcastToNearbyUsers(uploadedPulse);
		await notificationService.broadcastPulseUpdated(uploadedPulse);
		const serialized = await this.serializePulseForViewer(
			uploadedPulse,
			viewer,
		);

		return {
			success: true,
			message: "Pulse received",
			data: serialized,
		};
	}

	private async handleGetPulsesMessage(
		payload: PulseRetrievePayloadType,
		viewer: PulseViewerContext,
	): Promise<PulseSocketResponse> {
		if (!viewer) {
			return {
				success: false,
				message: "Unauthorized",
				data: null,
			};
		}

		const pulses = await this.getPulses(payload);
		const serialized = await this.serializePulsesForViewer(
			pulses ?? [],
			viewer,
		);

		return {
			success: true,
			message: "Pulses retrieved",
			data: serialized,
		};
	}

	private async handleGetMapPulsesMessage(
		payload: PulseRetrievePayloadType,
		viewer: PulseViewerContext,
	): Promise<PulseSocketResponse> {
		if (!viewer) {
			return {
				success: false,
				message: "Unauthorized",
				data: null,
			};
		}

		const pulses = await this.getMapPulses(viewer, payload);
		const serialized = await this.serializePulsesForViewer(
			pulses ?? [],
			viewer,
		);

		return {
			success: true,
			message: "Map pulses retrieved",
			data: serialized,
		};
	}
}

export const pulseService = new PulseService();
