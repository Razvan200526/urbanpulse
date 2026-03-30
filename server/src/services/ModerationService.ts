import type { PulseType, ReportType, UserType } from "@server/db/schema";
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
import { handleError } from "@server/utils/handleError";
import { PulseStatusEnum, ReportStatusEnum } from "@shared/types";
import type { CreateReportType } from "@shared/validators/reports/isCreateReportValid";
import type { ReviewReportType } from "@shared/validators/reports/isReviewReportValid";
import { notificationService } from "./NotificationService";

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
	targetPulse: Pick<
		PulseType,
		"id" | "title" | "status" | "type" | "isVerified"
	> | null;
};

export class ModerationService {
	private readonly reportRepo: ReportRepository;
	private readonly pulseRepo: PulseRepository;
	private readonly userRepo: UserRepository;
	private readonly pulseConfirmationRepo: PulseConfirmationRepository;

	constructor() {
		this.reportRepo = reportRepository;
		this.pulseRepo = pulseRepository;
		this.userRepo = userRepository;
		this.pulseConfirmationRepo = pulseConfirmationRepository;
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

			const existing = await this.pulseConfirmationRepo.findByPulseAndUser(
				pulseId,
				userId,
			);
			if (existing) {
				const confirmationCount =
					await this.pulseConfirmationRepo.countByPulseId(pulseId);
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

			const confirmationCount =
				await this.pulseConfirmationRepo.countByPulseId(pulseId);
			let nextPulse = pulse;
			let newlyVerified = false;

			if (
				!pulse.isVerified &&
				confirmationCount >= AUTO_VERIFY_CONFIRMATION_THRESHOLD
			) {
				nextPulse = await this.pulseRepo.update(pulseId, { isVerified: true });
				newlyVerified = true;
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
			let targetPulseId = payload.targetPulseId ?? null;

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
									status: targetPulse.status,
									type: targetPulse.type,
									isVerified: targetPulse.isVerified,
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
			if (payload.pulseStatus && existing.targetPulseId) {
				updatedPulse = await this.pulseRepo.update(existing.targetPulseId, {
					status: payload.pulseStatus,
					isResolved: payload.pulseStatus === PulseStatusEnum.Resolved,
				});
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
