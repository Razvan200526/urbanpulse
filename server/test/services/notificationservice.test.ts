import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import type { PulseType } from "@server/db/schema";
import { responseRepository } from "@server/repositories/ResponseRepository";
import { heroAlertMatchingService } from "@server/services/HeroAlertMatchingService";
import { NotificationService } from "@server/services/NotificationService";
import { socketManager } from "@server/services/SocketManager";
import {
	PulseEnum,
	PulseStatusEnum,
	PulseUploadStateEnum,
	ResponseStatusEnum,
	UrgencyEnum,
} from "@shared/types";

function buildPulse(overrides: Partial<PulseType> = {}): PulseType {
	return {
		id: "11111111-1111-1111-1111-111111111111",
		userId: "owner-1",
		type: PulseEnum.Skill,
		urgency: UrgencyEnum.Urgent,
		title: "Need help",
		description: "Nearby assistance needed",
		position: { x: 26.1025, y: 44.4268 } as PulseType["position"],
		status: PulseStatusEnum.Active,
		pulseUploadState: PulseUploadStateEnum.Uploaded,
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

afterEach(() => {
	mock.restore();
});

describe("NotificationService", () => {
	test("broadcastPulseUpdated sends live updates to nearby viewers for non-emergency pulses", async () => {
		const service = new NotificationService();
		const ownerConnection = {
			userId: "owner-1",
			ws: { send: mock() },
		} as any;
		const nearbyConnection = {
			userId: "viewer-1",
			ws: { send: mock() },
		} as any;
		const matchedConnection = {
			userId: "matched-1",
			ws: { send: mock() },
		} as any;
		const sendAndSaveSpy = spyOn(service, "sendAndSaveData").mockResolvedValue(
			undefined,
		);

		spyOn(socketManager, "getConnectionsForUser").mockImplementation(
			(userId: string) => {
				if (userId === "owner-1") {
					return [ownerConnection];
				}
				if (userId === "matched-1") {
					return [matchedConnection];
				}
				return [];
			},
		);
		spyOn(
			(service as any).locationService,
			"getNearbyConnections",
		).mockReturnValue([nearbyConnection]);
		spyOn(heroAlertMatchingService, "matchPulse").mockResolvedValue([
			{
				user: { id: "matched-1" },
				matchedTags: ["First Aid"],
				distanceMeters: 42,
				usedLiveLocation: true,
				quietHoursBypassed: false,
			} as any,
		]);

		await service.broadcastPulseUpdated(buildPulse());

		expect(sendAndSaveSpy).toHaveBeenCalledWith(
			[ownerConnection, nearbyConnection, matchedConnection],
			expect.objectContaining({
				channelName: "notifications:pulse_updated",
			}),
			false,
		);
	});

	test("marks handled pulse response notifications as non-actionable", async () => {
		const service = new NotificationService();
		const items = [
			{
				notification: {
					type: "PULSE_RESPONSE",
					payload: {
						pulseId: "pulse-1",
						responseId: "response-1",
					},
				},
				user: null,
			},
		];

		spyOn(
			(service as any).notificationRepo,
			"getNotificationsWithUsersByUserId",
		).mockResolvedValue(items as any);
		spyOn(responseRepository, "getOne").mockResolvedValue({
			id: "response-1",
			pulseId: "pulse-1",
			responderId: "user-2",
			status: ResponseStatusEnum.Accepted,
			createdAt: new Date(),
		} as any);

		await expect(service.getNotificationsWithUsers("owner-1")).resolves.toEqual(
			[
				{
					notification: {
						type: "PULSE_RESPONSE",
						payload: {
							pulseId: "pulse-1",
							responseId: "response-1",
							isActionable: false,
						},
					},
					user: null,
				},
			],
		);
	});
});
