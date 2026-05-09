import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import type { PulseResponseType, PulseType, UserType } from "@server/db/schema";
import { pulseRepository } from "@server/repositories/PulseRepository";
import { cacheManager } from "@server/services/cache/CacheManager";
import { messagingService } from "@server/services/MessagingService";
import { ResponseService } from "@server/services/ResponseService";
import {
	PulseEnum,
	PulseStatusEnum,
	PulseUploadStateEnum,
	ResponseStatusEnum,
	UrgencyEnum,
} from "@shared/types";

function buildPulse(overrides: Partial<PulseType> = {}): PulseType {
	return {
		id: "pulse-1",
		userId: "owner-1",
		type: PulseEnum.Emergency,
		incidentTypeId: null,
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

function buildResponse(
	overrides: Partial<PulseResponseType> = {},
): PulseResponseType {
	return {
		id: "response-1",
		pulseId: "pulse-1",
		responderId: "responder-1",
		status: ResponseStatusEnum.Pending,
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		...overrides,
	};
}

function buildUser(overrides: Partial<UserType> = {}): UserType {
	return {
		id: "responder-1",
		name: "Responder",
		email: "responder@example.com",
		emailVerified: true,
		image: null,
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		updatedAt: new Date("2025-01-01T00:00:00.000Z"),
		role: "user",
		bio: null,
		trustScore: 0,
		successfulInteractions: 0,
		failedInteractions: 0,
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

function createService({
	pulse = buildPulse(),
	response = buildResponse(),
	responder = buildUser(),
}: {
	pulse?: PulseType | null;
	response?: PulseResponseType | null;
	responder?: UserType | null;
} = {}) {
	const service = new ResponseService();
	const responseRepo = {
		getOne: mock(async () => response),
		update: mock(async (_id: string, data: Partial<PulseResponseType>) => ({
			...(response ?? buildResponse()),
			...data,
		})),
		declineOtherPendingForPulse: mock(async () => undefined),
		create: mock(),
		getAll: mock(),
		delete: mock(),
	};
	const userRepo = {
		getOne: mock(async (id: string) =>
			id === responder?.id ? responder : null,
		),
		update: mock(async (_id: string, data: Partial<UserType>) => ({
			...(responder ?? buildUser()),
			...data,
		})),
	};

	(service as any).responseRepo = responseRepo;
	(service as any).userRepo = userRepo;

	spyOn(pulseRepository, "getOne").mockResolvedValue(pulse);
	spyOn(messagingService, "ensureCoordinationConversation").mockResolvedValue({
		id: "conversation-1",
	} as Awaited<
		ReturnType<typeof messagingService.ensureCoordinationConversation>
	>);
	spyOn(cacheManager, "invalidate").mockResolvedValue(undefined);

	return { service, responseRepo, userRepo };
}

afterEach(() => {
	mock.restore();
});

describe("ResponseService reputation updates", () => {
	test("bumps trust score after every third accepted pulse help", async () => {
		const { service, userRepo } = createService({
			responder: buildUser({
				successfulInteractions: 2,
				trustScore: 80,
				isVerified: false,
			}),
		});

		await service.acceptHelpOffer("owner-1", "pulse-1", "response-1");

		expect(userRepo.update).toHaveBeenCalledWith("responder-1", {
			successfulInteractions: 3,
			isVerified: true,
			trustScore: 85,
		});
	});

	test("lowers trust score after every third rejected pulse help", async () => {
		const { service, userRepo } = createService({
			responder: buildUser({
				failedInteractions: 2,
				trustScore: 80,
			}),
		});

		await service.rejectHelpOffer("owner-1", "pulse-1", "response-1");

		expect(userRepo.update).toHaveBeenCalledWith("responder-1", {
			failedInteractions: 3,
			trustScore: 75,
		});
	});
});
