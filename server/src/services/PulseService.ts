import type { PulseType, UserType } from "@server/db/schema";
import { cacheManager } from "@server/services/cache/CacheManager";
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
import { notificationService } from "@server/services/NotificationService";
import { requestMatchingAIService } from "@server/services/RequestMatchingAIService";
import type { Last7DaysPulseCounts } from "@server/services/types";
import { handleError } from "@server/utils/handleError";
import { PulseStatusEnum, PulseUploadStateEnum } from "@shared/types";
import type { PulseRetrievePayloadType } from "@shared/validators/pulses/isPulseRetrieveValid";
import {
	type PulseSocketMessageType,
	pulseSocketMessageSchema,
} from "@shared/validators/pulses/isPulseSocketMessageValid";
import type { PulseUpdateBody } from "@shared/validators/pulses/isPulseUpdateValid";

type PulseSocketResponse = {
	success: boolean;
	message: string;
	data: PulseType | PulseType[] | null;
};

type PulseViewerContext = Pick<UserType, "id" | "role"> | null;

/**
 * Service for managing Urban Pulse records and retrieving location-based pulses.
 */
export class PulseService {
	private pulseRepository: PulseRepository;
	responseRepository: ResponseRepository;
	private cache = cacheManager;

	constructor() {
		this.pulseRepository = pulseRepository;
		this.responseRepository = responseRepository;
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

	async serializePulseForViewer(
		pulse: PulseType,
		_viewer: PulseViewerContext,
	): Promise<PulseType> {
		return pulse;
	}

	async serializePulsesForViewer(
		pulses: PulseType[],
		viewer: PulseViewerContext,
	): Promise<PulseType[]> {
		return Promise.all(
			pulses.map((pulse) => this.serializePulseForViewer(pulse, viewer)),
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
			{ namespace: "pulse", ttl: 300 }
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

			return await this.pulseRepository.create({
				...data,
				requestedSkillTags,
				matchMetadata,
				isVerified: false,
				mergedIntoPulseId: null,
				moderationNote: null,
			});
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
			return await this.pulseRepository.update(pulseId, data);
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
			return await this.pulseRepository.update(pulseId, patch);
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
		// Create cache key from location and filters (round coordinates to reduce cache variations)
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
			{ namespace: "pulse", ttl: 300 }
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
