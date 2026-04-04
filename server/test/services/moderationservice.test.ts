import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import type { PulseType, UserType } from "@server/db/schema";
import { ModerationService } from "@server/services/ModerationService";
import { notificationService } from "@server/services/NotificationService";
import {
	PulseEnum,
	PulseStatusEnum,
	PulseUploadStateEnum,
	UrgencyEnum,
} from "@shared/types";

function buildPulse(overrides: Partial<PulseType> = {}): PulseType {
	return {
		id: "11111111-1111-1111-1111-111111111111",
		userId: "owner-1",
		type: PulseEnum.Emergency,
		urgency: UrgencyEnum.Urgent,
		title: "Need help",
		description: "Nearby assistance needed",
		position: { x: 26.1025, y: 44.4268 } as PulseType["position"],
		status: PulseStatusEnum.Active,
		pulseUploadState: PulseUploadStateEnum.Pending,
		audioUrl: null,
		imageUrls: [],
		requestedSkillTags: [],
		matchMetadata: {},
		isResolved: false,
		isVerified: false,
		mergedIntoPulseId: null,
		moderationNote: null,
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		...overrides,
	};
}

function buildUser(overrides: Partial<UserType> = {}): UserType {
	return {
		id: "user-1",
		name: "User",
		email: "user@example.com",
		emailVerified: true,
		image: null,
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		updatedAt: new Date("2025-01-01T00:00:00.000Z"),
		role: "user",
		bio: null,
		trustScore: 0,
		successfulInteractions: 0,
		isVerified: false,
		rememberMe: false,
		banned: false,
		banReason: null,
		banExpires: null,
		homeLocation: null,
		lastKnownLocation: null,
		lastKnownLocationUpdatedAt: null,
		heroAlertRadiusMeters: 500,
		...overrides,
	};
}

function createService() {
	const service = new ModerationService();
	(service as any).pulseRepo = {
		getOne: mock(),
		update: mock(),
		getAll: mock(),
	};
	(service as any).userRepo = {
		getOne: mock(),
	};
	(service as any).reportRepo = {
		getAll: mock(),
		getOne: mock(),
		update: mock(),
		findPendingByReporterAndTargets: mock(),
		create: mock(),
	};
	(service as any).pulseConfirmationRepo = {
		findByPulseAndUser: mock(),
		create: mock(),
		getByPulseId: mock(),
	};
	return service as ModerationService & {
		pulseRepo: {
			getOne: ReturnType<typeof mock>;
			update: ReturnType<typeof mock>;
			getAll: ReturnType<typeof mock>;
		};
		userRepo: {
			getOne: ReturnType<typeof mock>;
		};
		pulseConfirmationRepo: {
			findByPulseAndUser: ReturnType<typeof mock>;
			create: ReturnType<typeof mock>;
			getByPulseId: ReturnType<typeof mock>;
		};
	};
}

afterEach(() => {
	mock.restore();
});

describe("ModerationService.confirmPulse", () => {
	test("rejects users who are not email verified", async () => {
		const service = createService();
		service.pulseRepo.getOne.mockResolvedValue(buildPulse());
		service.userRepo.getOne.mockResolvedValue(
			buildUser({ id: "user-2", emailVerified: false }),
		);

		await expect(service.confirmPulse("pulse-1", "user-2")).resolves.toEqual({
			ok: false,
			code: "FORBIDDEN",
			message: "Only verified active community members can confirm a pulse",
		});
	});

	test("auto-verifies a pulse after three independent confirmations", async () => {
		const service = createService();
		const pulse = buildPulse({ id: "pulse-1", userId: "owner-1" });
		const updatedPulse = buildPulse({
			id: "pulse-1",
			userId: "owner-1",
			isVerified: true,
		});

		service.pulseRepo.getOne.mockResolvedValue(pulse);
		service.pulseRepo.update.mockResolvedValue(updatedPulse);
		service.userRepo.getOne.mockImplementation(async (userId: string) => {
			if (userId === "user-2") return buildUser({ id: "user-2" });
			if (userId === "user-3") return buildUser({ id: "user-3" });
			if (userId === "user-4") return buildUser({ id: "user-4" });
			return buildUser({ id: userId });
		});
		service.pulseConfirmationRepo.findByPulseAndUser.mockResolvedValue(null);
		service.pulseConfirmationRepo.create.mockResolvedValue({
			id: "confirmation-1",
			pulseId: "pulse-1",
			userId: "user-2",
			confirmedAt: new Date("2025-01-01T00:00:00.000Z"),
		});
		service.pulseConfirmationRepo.getByPulseId.mockResolvedValue([
			{
				id: "confirmation-1",
				pulseId: "pulse-1",
				userId: "user-2",
				confirmedAt: new Date("2025-01-01T00:00:00.000Z"),
			},
			{
				id: "confirmation-2",
				pulseId: "pulse-1",
				userId: "user-3",
				confirmedAt: new Date("2025-01-01T00:00:00.000Z"),
			},
			{
				id: "confirmation-3",
				pulseId: "pulse-1",
				userId: "user-4",
				confirmedAt: new Date("2025-01-01T00:00:00.000Z"),
			},
		]);

		const broadcastSpy = spyOn(
			notificationService,
			"broadcastPulseUpdated",
		).mockImplementation(() => {});
		const notifyOwnerSpy = spyOn(
			notificationService,
			"notifyPulseConfirmed",
		).mockResolvedValue(undefined);

		await expect(service.confirmPulse("pulse-1", "user-2")).resolves.toEqual({
			ok: true,
			data: {
				pulse: updatedPulse,
				confirmationCount: 3,
				alreadyConfirmed: false,
				newlyVerified: true,
			},
		});

		expect(service.pulseRepo.update).toHaveBeenCalledWith("pulse-1", {
			isVerified: true,
		});
		expect(broadcastSpy).toHaveBeenCalledWith(updatedPulse);
		expect(notifyOwnerSpy).toHaveBeenCalled();
	});
});
