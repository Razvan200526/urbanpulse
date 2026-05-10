import { db } from "@server/db";
import {
	conversation,
	type IncidentTypeType,
	type PulseType,
	pulse,
	pulseConfirmation,
	pulseResponse,
	type ReportType,
	report,
	type UserType,
} from "@server/db/schema";
import {
	type PulseConfirmationRepository,
	pulseConfirmationRepository,
} from "@server/repositories/PulseConfirmationRepository";
import {
	type PulseRepository,
	pulseRepository,
} from "@server/repositories/PulseRepository";
import {
	type ReportRepository,
	reportRepository,
} from "@server/repositories/ReportRepository";
import {
	type UserRepository,
	userRepository,
} from "@server/repositories/UserRepository";
import { cacheManager } from "@server/services/cache/CacheManager";
import { calculateDistance } from "@server/utils/calculateDistance";
import { handleError } from "@server/utils/handleError";
import { PulseStatusEnum, ReportStatusEnum } from "@shared/types";
import type { MergePulseType } from "@shared/validators/admin/isMergePulseValid";
import type { ModeratePulseType } from "@shared/validators/admin/isModeratePulseValid";
import type { CreateReportType } from "@shared/validators/reports/isCreateReportValid";
import type { ReviewReportType } from "@shared/validators/reports/isReviewReportValid";
import { eq } from "drizzle-orm";
import { incidentTypeService } from "./IncidentTypeService";
import { notificationService } from "./NotificationService";
import { clusteringService } from "./ClusterigService";

const AUTO_VERIFY_CONFIRMATION_THRESHOLD = 3;

type ModerationFailureCode =
	| "NOT_FOUND"
	| "FORBIDDEN"
	| "CONFLICT"
	| "INVALID_STATE";

type ModerationResult<T> =
	| {
			ok: true;
			data: T;
	  }
	| {
			ok: false;
			code: ModerationFailureCode;
			message: string;
	  };

export type AdminReportQueueItem = {
	id: string;
	reason: string;
	status: string;
	createdAt: Date;
	reporter: Pick<UserType, "id" | "name" | "email" | "role"> | null;
	targetUser: Pick<UserType, "id" | "name" | "email" | "role"> | null;
	targetPulse:
		| (Pick<
				PulseType,
				| "id"
				| "title"
				| "description"
				| "status"
				| "type"
				| "incidentTypeId"
				| "isVerified"
				| "moderationNote"
		  > & { incidentType: IncidentTypeType | null })
		| null;
};

export type DuplicatePulseCandidate = {
	sourcePulse: Pick<
		PulseType,
		| "id"
		| "title"
		| "description"
		| "type"
		| "incidentTypeId"
		| "status"
		| "createdAt"
		| "isVerified"
	> & { incidentType: IncidentTypeType | null };
	targetPulse: Pick<
		PulseType,
		| "id"
		| "title"
		| "description"
		| "type"
		| "incidentTypeId"
		| "status"
		| "createdAt"
		| "isVerified"
	> & { incidentType: IncidentTypeType | null };
	distanceMeters: number;
	hoursApart: number;
	titleSimilarity: number;
};

export class ModerationService {
	private readonly reportRepo: ReportRepository;
	private readonly pulseRepo: PulseRepository;
	private readonly userRepo: UserRepository;
	private readonly pulseConfirmationRepo: PulseConfirmationRepository;
	private readonly cache = cacheManager;

	constructor() {
		this.reportRepo = reportRepository;
		this.pulseRepo = pulseRepository;
		this.userRepo = userRepository;
		this.pulseConfirmationRepo = pulseConfirmationRepository;
	}

	private async invalidatePulseCaches(...pulseIds: string[]) {
		const uniquePulseIds = Array.from(new Set(pulseIds.filter(Boolean)));
		await Promise.all([
			...uniquePulseIds.map((pulseId) =>
				this.cache.invalidate(pulseId, { namespace: "pulse" }),
			),
			this.cache.invalidatePattern("nearby:*", "pulse"),
			this.cache.invalidatePattern("*:matches", "heroAlert"),
			this.cache.invalidatePattern("overview:*", "dashboard"),
		]);
	}

	private async getIndependentConfirmationCount(pulseId: string) {
		const confirmations =
			await this.pulseConfirmationRepo.getByPulseId(pulseId);
		const users = await Promise.all(
			confirmations.map((entry) => this.userRepo.getOne(entry.userId)),
		);

		return users.filter((user): user is UserType =>
			Boolean(user?.emailVerified && !user.banned),
		).length;
	}

	private buildModerationPatch(payload: {
		status?: PulseType["status"];
		isVerified?: boolean;
		moderationNote?: string;
	}) {
		const patch: Partial<PulseType> = {};

		if (payload.status) {
			patch.status = payload.status;
			patch.isResolved = payload.status === PulseStatusEnum.Resolved;
		}

		if (payload.isVerified !== undefined) {
			patch.isVerified = payload.isVerified;
		}

		if (payload.moderationNote !== undefined) {
			patch.moderationNote = payload.moderationNote || null;
		}

		return patch;
	}

	private getTitleSimilarity(left: string, right: string) {
		const leftTokens = new Set(
			left
				.toLowerCase()
				.split(/\W+/)
				.map((token) => token.trim())
				.filter(Boolean),
		);
		const rightTokens = new Set(
			right
				.toLowerCase()
				.split(/\W+/)
				.map((token) => token.trim())
				.filter(Boolean),
		);

		if (leftTokens.size === 0 || rightTokens.size === 0) {
			return 0;
		}

		const overlap = Array.from(leftTokens).filter((token) =>
			rightTokens.has(token),
		).length;
		return overlap / Math.max(leftTokens.size, rightTokens.size);
	}

	private async getIncidentTypeForPulse(
		pulse: Pick<PulseType, "incidentTypeId">,
	) {
		if (!pulse.incidentTypeId) {
			return null;
		}

		return await incidentTypeService.getIncidentTypeById(pulse.incidentTypeId);
	}

	async confirmPulse(
		pulseId: string,
		userId: string,
	): Promise<
		ModerationResult<{
			pulse: PulseType;
			confirmationCount: number;
			alreadyConfirmed: boolean;
			newlyVerified: boolean;
		}>
	> {
		try {
			const pulse = await this.pulseRepo.getOne(pulseId);
			if (!pulse) {
				return {
					ok: false,
					code: "NOT_FOUND",
					message: "Pulse not found",
				};
			}

			if (pulse.mergedIntoPulseId) {
				return {
					ok: false,
					code: "INVALID_STATE",
					message: "This pulse was merged into another report",
				};
			}

			if (pulse.userId === userId) {
				return {
					ok: false,
					code: "FORBIDDEN",
					message: "You cannot confirm your own pulse",
				};
			}

			if (pulse.status !== PulseStatusEnum.Active) {
				return {
					ok: false,
					code: "INVALID_STATE",
					message: "Only active pulses can be confirmed",
				};
			}

			const confirmingUser = await this.userRepo.getOne(userId);
			if (!confirmingUser?.emailVerified || confirmingUser.banned) {
				return {
					ok: false,
					code: "FORBIDDEN",
					message: "Only verified active community members can confirm a pulse",
				};
			}

			const existing = await this.pulseConfirmationRepo.findByPulseAndUser(
				pulseId,
				userId,
			);
			if (existing) {
				const confirmationCount =
					await this.getIndependentConfirmationCount(pulseId);
				return {
					ok: true,
					data: {
						pulse,
						confirmationCount,
						alreadyConfirmed: true,
						newlyVerified: false,
					},
				};
			}

			await this.pulseConfirmationRepo.create({ pulseId, userId });
			await clusteringService.recalculateClustersForPulse(pulseId);

			const confirmationCount =
				await this.getIndependentConfirmationCount(pulseId);
			let nextPulse = pulse;
			let newlyVerified = false;

			if (
				!pulse.isVerified &&
				confirmationCount >= AUTO_VERIFY_CONFIRMATION_THRESHOLD
			) {
				nextPulse = await this.pulseRepo.update(pulseId, { isVerified: true });
				newlyVerified = true;
				await this.invalidatePulseCaches(pulseId);
				notificationService.broadcastPulseUpdated(nextPulse);
				await notificationService.notifyPulseConfirmed({
					ownerUserId: pulse.userId,
					pulseId: pulse.id,
					pulseTitle: pulse.title,
					confirmationCount,
				});
			}

			return {
				ok: true,
				data: {
					pulse: nextPulse,
					confirmationCount,
					alreadyConfirmed: false,
					newlyVerified,
				},
			};
		} catch (error) {
			handleError(error);
			return {
				ok: false,
				code: "INVALID_STATE",
				message: "Failed to confirm pulse",
			};
		}
	}

	async createReport(
		reporterId: string,
		payload: CreateReportType,
	): Promise<ModerationResult<{ report: ReportType }>> {
		try {
			let targetUserId = payload.targetUserId ?? null;
			const targetPulseId = payload.targetPulseId ?? null;

			if (targetPulseId) {
				const pulse = await this.pulseRepo.getOne(targetPulseId);
				if (!pulse) {
					return {
						ok: false,
						code: "NOT_FOUND",
						message: "Pulse not found",
					};
				}

				if (pulse.userId === reporterId) {
					return {
						ok: false,
						code: "FORBIDDEN",
						message: "You cannot report your own pulse",
					};
				}

				targetUserId = targetUserId ?? pulse.userId;
			}

			if (targetUserId === reporterId) {
				return {
					ok: false,
					code: "FORBIDDEN",
					message: "You cannot report your own account",
				};
			}

			if (targetUserId) {
				const targetUser = await this.userRepo.getOne(targetUserId);
				if (!targetUser) {
					return {
						ok: false,
						code: "NOT_FOUND",
						message: "Target user not found",
					};
				}
			}

			const existing = await this.reportRepo.findPendingByReporterAndTargets({
				reporterId,
				targetPulseId,
				targetUserId,
			});
			if (existing) {
				return {
					ok: false,
					code: "CONFLICT",
					message: "You already submitted a pending report for this target",
				};
			}

			const report = await this.reportRepo.create({
				reporterId,
				targetUserId,
				targetPulseId,
				reason: payload.reason,
				status: ReportStatusEnum.Pending,
			});

			if (!report) {
				return {
					ok: false,
					code: "INVALID_STATE",
					message: "Failed to create report",
				};
			}

			return {
				ok: true,
				data: { report },
			};
		} catch (error) {
			handleError(error);
			return {
				ok: false,
				code: "INVALID_STATE",
				message: "Failed to create report",
			};
		}
	}

	async getAdminReportQueue(): Promise<AdminReportQueueItem[]> {
		try {
			const reports = await this.reportRepo.getAll();
			const sorted = reports.sort(
				(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
			);

			return await Promise.all(
				sorted.map(async (entry) => {
					const [reporter, targetUser, targetPulse] = await Promise.all([
						this.userRepo.getOne(entry.reporterId),
						entry.targetUserId
							? this.userRepo.getOne(entry.targetUserId)
							: Promise.resolve(null),
						entry.targetPulseId
							? this.pulseRepo.getOne(entry.targetPulseId)
							: Promise.resolve(null),
					]);

					return {
						id: entry.id,
						reason: entry.reason,
						status: entry.status,
						createdAt: entry.createdAt,
						reporter: reporter
							? {
									id: reporter.id,
									name: reporter.name,
									email: reporter.email,
									role: reporter.role ?? "user",
								}
							: null,
						targetUser: targetUser
							? {
									id: targetUser.id,
									name: targetUser.name,
									email: targetUser.email,
									role: targetUser.role ?? "user",
								}
							: null,
						targetPulse: targetPulse
							? {
									id: targetPulse.id,
									title: targetPulse.title,
									description: targetPulse.description,
									status: targetPulse.status,
									type: targetPulse.type,
									incidentTypeId: targetPulse.incidentTypeId,
									incidentType: await this.getIncidentTypeForPulse(targetPulse),
									isVerified: targetPulse.isVerified,
									moderationNote: targetPulse.moderationNote,
								}
							: null,
					};
				}),
			);
		} catch (error) {
			handleError(error);
			return [];
		}
	}

	async getDuplicatePulseCandidates(): Promise<DuplicatePulseCandidate[]> {
		try {
			const pulses = (await this.pulseRepo.getAll())
				.filter(
					(entry) =>
						entry.status === PulseStatusEnum.Active && !entry.mergedIntoPulseId,
				)
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

			const candidates: DuplicatePulseCandidate[] = [];

			for (let index = 0; index < pulses.length; index += 1) {
				const source = pulses[index];
				if (!source) {
					continue;
				}

				for (
					let compareIndex = index + 1;
					compareIndex < pulses.length;
					compareIndex += 1
				) {
					const target = pulses[compareIndex];
					if (!target || target.type !== source.type) {
						continue;
					}

					const hoursApart =
						Math.abs(source.createdAt.getTime() - target.createdAt.getTime()) /
						(1000 * 60 * 60);
					if (hoursApart > 6) {
						continue;
					}

					const distanceMeters =
						calculateDistance(
							{ lat: source.position.y, lng: source.position.x },
							{ lat: target.position.y, lng: target.position.x },
						) * 1000;
					if (distanceMeters > 500) {
						continue;
					}

					const titleSimilarity = this.getTitleSimilarity(
						source.title,
						target.title,
					);
					if (titleSimilarity < 0.5) {
						continue;
					}

					candidates.push({
						sourcePulse: {
							id: source.id,
							title: source.title,
							description: source.description,
							type: source.type,
							incidentTypeId: source.incidentTypeId,
							incidentType: await this.getIncidentTypeForPulse(source),
							status: source.status,
							createdAt: source.createdAt,
							isVerified: source.isVerified,
						},
						targetPulse: {
							id: target.id,
							title: target.title,
							description: target.description,
							type: target.type,
							incidentTypeId: target.incidentTypeId,
							incidentType: await this.getIncidentTypeForPulse(target),
							status: target.status,
							createdAt: target.createdAt,
							isVerified: target.isVerified,
						},
						distanceMeters: Math.round(distanceMeters),
						hoursApart: Number(hoursApart.toFixed(2)),
						titleSimilarity: Number(titleSimilarity.toFixed(2)),
					});
				}
			}

			return candidates.sort(
				(left, right) =>
					right.titleSimilarity - left.titleSimilarity ||
					left.distanceMeters - right.distanceMeters,
			);
		} catch (error) {
			handleError(error);
			return [];
		}
	}

	async moderatePulse(
		pulseId: string,
		payload: ModeratePulseType,
	): Promise<ModerationResult<{ pulse: PulseType }>> {
		try {
			const existing = await this.pulseRepo.getOne(pulseId);
			if (!existing) {
				return {
					ok: false,
					code: "NOT_FOUND",
					message: "Pulse not found",
				};
			}

			const updatedPulse = await this.pulseRepo.update(
				pulseId,
				this.buildModerationPatch(payload),
			);
			await this.invalidatePulseCaches(pulseId);
			notificationService.broadcastPulseUpdated(updatedPulse);

			return {
				ok: true,
				data: { pulse: updatedPulse },
			};
		} catch (error) {
			handleError(error);
			return {
				ok: false,
				code: "INVALID_STATE",
				message: "Failed to moderate pulse",
			};
		}
	}

	async mergePulse(payload: MergePulseType): Promise<
		ModerationResult<{
			sourcePulse: PulseType;
			targetPulse: PulseType;
		}>
	> {
		try {
			const [sourcePulse, targetPulse] = await Promise.all([
				this.pulseRepo.getOne(payload.sourcePulseId),
				this.pulseRepo.getOne(payload.targetPulseId),
			]);

			if (!sourcePulse || !targetPulse) {
				return {
					ok: false,
					code: "NOT_FOUND",
					message: "One or both pulses were not found",
				};
			}

			if (sourcePulse.mergedIntoPulseId || targetPulse.mergedIntoPulseId) {
				return {
					ok: false,
					code: "INVALID_STATE",
					message: "Merged pulses cannot be merged again",
				};
			}

			await db.transaction(async (tx) => {
				const sourceConfirmations = await tx
					.select()
					.from(pulseConfirmation)
					.where(eq(pulseConfirmation.pulseId, sourcePulse.id));
				const targetConfirmations = await tx
					.select()
					.from(pulseConfirmation)
					.where(eq(pulseConfirmation.pulseId, targetPulse.id));
				const targetConfirmationUsers = new Set(
					targetConfirmations.map((entry) => entry.userId),
				);

				for (const confirmation of sourceConfirmations) {
					if (targetConfirmationUsers.has(confirmation.userId)) {
						await tx
							.delete(pulseConfirmation)
							.where(eq(pulseConfirmation.id, confirmation.id));
						continue;
					}

					await tx
						.update(pulseConfirmation)
						.set({ pulseId: targetPulse.id })
						.where(eq(pulseConfirmation.id, confirmation.id));
				}

				const sourceResponses = await tx
					.select()
					.from(pulseResponse)
					.where(eq(pulseResponse.pulseId, sourcePulse.id));
				const targetResponses = await tx
					.select()
					.from(pulseResponse)
					.where(eq(pulseResponse.pulseId, targetPulse.id));
				const targetResponders = new Set(
					targetResponses.map((entry) => entry.responderId),
				);

				for (const response of sourceResponses) {
					if (targetResponders.has(response.responderId)) {
						await tx
							.delete(pulseResponse)
							.where(eq(pulseResponse.id, response.id));
						continue;
					}

					await tx
						.update(pulseResponse)
						.set({ pulseId: targetPulse.id })
						.where(eq(pulseResponse.id, response.id));
				}

				await tx
					.update(report)
					.set({ targetPulseId: targetPulse.id })
					.where(eq(report.targetPulseId, sourcePulse.id));

				await tx
					.update(conversation)
					.set({ pulseId: targetPulse.id })
					.where(eq(conversation.pulseId, sourcePulse.id));

				await tx
					.update(pulse)
					.set({
						status: PulseStatusEnum.Dismissed,
						isResolved: true,
						isVerified: false,
						mergedIntoPulseId: targetPulse.id,
						moderationNote: payload.reason,
					})
					.where(eq(pulse.id, sourcePulse.id));
			});

			const mergedSourcePulse = await this.pulseRepo.getOne(sourcePulse.id);
			let refreshedTargetPulse = await this.pulseRepo.getOne(targetPulse.id);

			if (!mergedSourcePulse || !refreshedTargetPulse) {
				return {
					ok: false,
					code: "INVALID_STATE",
					message: "Failed to reload pulses after merge",
				};
			}

			const confirmationCount = await this.getIndependentConfirmationCount(
				targetPulse.id,
			);
			if (
				!refreshedTargetPulse.isVerified &&
				refreshedTargetPulse.status === PulseStatusEnum.Active &&
				confirmationCount >= AUTO_VERIFY_CONFIRMATION_THRESHOLD
			) {
				refreshedTargetPulse = await this.pulseRepo.update(targetPulse.id, {
					isVerified: true,
				});
			}

			await this.invalidatePulseCaches(sourcePulse.id, targetPulse.id);
			notificationService.broadcastPulseUpdated(mergedSourcePulse);
			notificationService.broadcastPulseUpdated(refreshedTargetPulse);

			return {
				ok: true,
				data: {
					sourcePulse: mergedSourcePulse,
					targetPulse: refreshedTargetPulse,
				},
			};
		} catch (error) {
			handleError(error);
			return {
				ok: false,
				code: "INVALID_STATE",
				message: "Failed to merge pulses",
			};
		}
	}

	async reviewReport(
		reportId: string,
		payload: ReviewReportType,
	): Promise<
		ModerationResult<{
			report: ReportType;
			pulse: PulseType | null;
		}>
	> {
		try {
			const existing = await this.reportRepo.getOne(reportId);
			if (!existing) {
				return {
					ok: false,
					code: "NOT_FOUND",
					message: "Report not found",
				};
			}

			let updatedPulse: PulseType | null = null;
			if (
				existing.targetPulseId &&
				(payload.pulseStatus !== undefined ||
					payload.pulseVerification !== undefined ||
					payload.moderationNote !== undefined)
			) {
				updatedPulse = await this.pulseRepo.update(
					existing.targetPulseId,
					this.buildModerationPatch({
						status: payload.pulseStatus,
						isVerified: payload.pulseVerification,
						moderationNote: payload.moderationNote,
					}),
				);
				await this.invalidatePulseCaches(existing.targetPulseId);
				notificationService.broadcastPulseUpdated(updatedPulse);
			}

			const report = await this.reportRepo.update(reportId, {
				status: payload.status,
			});

			return {
				ok: true,
				data: {
					report,
					pulse: updatedPulse,
				},
			};
		} catch (error) {
			handleError(error);
			return {
				ok: false,
				code: "INVALID_STATE",
				message: "Failed to review report",
			};
		}
	}
}

export const moderationService = new ModerationService();
