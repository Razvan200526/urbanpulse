import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import type { PulseType } from "@server/db/schema";
import { responseRepository } from "@server/repositories/ResponseRepository";
import { cacheManager } from "@server/services/cache/CacheManager";
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
	test("createNotification invalidates the cached dashboard overview", async () => {
		const service = new NotificationService();
		const invalidatePatternSpy = spyOn(
			cacheManager,
			"invalidatePattern",
		).mockResolvedValue(undefined);
		spyOn((service as any).notificationRepo, "create").mockResolvedValue({
			id: "notification-1",
			userId: "user-1",
			type: "MESSAGE",
			payload: { body: "hello" },
			read: false,
			createdAt: new Date("2025-01-01T00:00:00.000Z"),
		});

		await expect(
			service.createNotification({
				userId: "user-1",
				type: "MESSAGE",
				payload: { body: "hello" },
			}),
		).resolves.toEqual(
			expect.objectContaining({
				id: "notification-1",
			}),
		);
		expect(invalidatePatternSpy).toHaveBeenCalledWith(
			"overview:*",
			"dashboard",
		);
	});

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

	test("broadcastPulseUpdated reaches connected viewers before location sync", async () => {
		const service = new NotificationService();
		const unsyncedConnection = {
			userId: "viewer-1",
			ws: { send: mock() },
		} as any;
		const sendAndSaveSpy = spyOn(service, "sendAndSaveData").mockResolvedValue(
			undefined,
		);

		spyOn(socketManager, "getConnectionsForUser").mockReturnValue([]);
		spyOn(socketManager, "getAllConnections").mockReturnValue([
			unsyncedConnection,
		]);
		spyOn(
			(service as any).locationService,
			"getNearbyConnections",
		).mockReturnValue([]);
		spyOn(heroAlertMatchingService, "matchPulse").mockResolvedValue([]);

		await service.broadcastPulseUpdated(buildPulse());

		expect(sendAndSaveSpy).toHaveBeenCalledWith(
			[unsyncedConnection],
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

	test("filters self-authored hero alerts from notification history", async () => {
		const service = new NotificationService();
		const items = [
			{
				notification: {
					type: "HERO_ALERT",
					payload: {
						pulseId: "pulse-1",
						pulse: buildPulse({ userId: "owner-1" }),
					},
				},
				user: null,
			},
		];

		spyOn(
			(service as any).notificationRepo,
			"getNotificationsWithUsersByUserId",
		).mockResolvedValue(items as any);

		await expect(service.getNotificationsWithUsers("owner-1")).resolves.toEqual(
			[],
		);
	});

	test("keeps hero alerts authored by other users in notification history", async () => {
		const service = new NotificationService();
		const items = [
			{
				notification: {
					type: "HERO_ALERT",
					payload: {
						pulseId: "pulse-1",
						pulse: buildPulse({ userId: "other-user" }),
					},
				},
				user: null,
			},
		];

		spyOn(
			(service as any).notificationRepo,
			"getNotificationsWithUsersByUserId",
		).mockResolvedValue(items as any);

		await expect(service.getNotificationsWithUsers("owner-1")).resolves.toEqual(
			items,
		);
	});

	test("keeps direct owner notifications even when they reference the owner's pulse", async () => {
		const service = new NotificationService();
		const items = [
			{
				notification: {
					type: "PULSE_CONFIRMED",
					payload: {
						pulseId: "pulse-1",
						confirmationCount: 3,
						pulse: buildPulse({ userId: "owner-1" }),
					},
				},
				user: null,
			},
		];

		spyOn(
			(service as any).notificationRepo,
			"getNotificationsWithUsersByUserId",
		).mockResolvedValue(items as any);

		await expect(service.getNotificationsWithUsers("owner-1")).resolves.toEqual(
			items,
		);
	});

	test("does not broadcast hero alerts back to the pulse owner", async () => {
		const service = new NotificationService();
		const notifyUsersSpy = spyOn(service, "notifyUsers").mockResolvedValue(
			undefined,
		);
		spyOn(heroAlertMatchingService, "matchPulse").mockResolvedValue([
			{
				user: { id: "owner-1" },
				matchedTags: ["First Aid"],
				distanceMeters: 12,
				usedLiveLocation: true,
				quietHoursBypassed: false,
			} as any,
			{
				user: { id: "viewer-1" },
				matchedTags: ["First Aid"],
				distanceMeters: 42,
				usedLiveLocation: true,
				quietHoursBypassed: false,
			} as any,
		]);

		await service.broadcastToNearbyUsers(buildPulse({ userId: "owner-1" }));

		expect(notifyUsersSpy).toHaveBeenCalledTimes(1);
		expect(notifyUsersSpy).toHaveBeenCalledWith(
			["viewer-1"],
			expect.objectContaining({
				channelName: "notifications:broadcast",
			}),
		);
	});

	test("sends persisted notification data once per user across multiple connections", async () => {
		const service = new NotificationService();
		const firstConnection = {
			userId: "user-1",
			ws: { send: mock() },
		} as any;
		const secondConnection = {
			userId: "user-1",
			ws: { send: mock() },
		} as any;
		const persistedNotification = {
			id: "notification-1",
			userId: "user-1",
			type: "TRANSACTION",
			payload: { transactionId: "transaction-1" },
			read: false,
			createdAt: new Date("2025-01-01T00:00:00.000Z"),
		} as any;

		spyOn(socketManager, "getConnectionsForUser").mockReturnValue([
			firstConnection,
			secondConnection,
		]);
		const createSpy = spyOn(service, "createNotification").mockResolvedValue(
			persistedNotification,
		);

		await service.notifyUsers(
			["user-1", "user-1"],
			{
				success: true,
				channelName: "notifications:transaction",
				data: {
					type: "TRANSACTION",
					payload: { transactionId: "transaction-1" },
				},
				message: "Transaction updated",
			},
			true,
		);

		expect(createSpy).toHaveBeenCalledTimes(1);
		for (const connection of [firstConnection, secondConnection]) {
			expect(connection.ws.send).toHaveBeenCalledTimes(1);
			expect(JSON.parse(connection.ws.send.mock.calls[0][0])).toEqual(
				expect.objectContaining({
					data: expect.objectContaining({
						notification: expect.objectContaining({
							id: persistedNotification.id,
							userId: persistedNotification.userId,
							type: persistedNotification.type,
							payload: persistedNotification.payload,
						}),
					}),
				}),
			);
		}
	});

	test("persists notifications for offline users", async () => {
		const service = new NotificationService();
		const createSpy = spyOn(service, "createNotification").mockResolvedValue({
			id: "notification-1",
			userId: "offline-user",
			type: "TRANSACTION",
			payload: { transactionId: "transaction-1" },
			read: false,
			createdAt: new Date("2025-01-01T00:00:00.000Z"),
		} as any);

		spyOn(socketManager, "getConnectionsForUser").mockReturnValue([]);

		await service.notifyUsers(
			["offline-user"],
			{
				success: true,
				channelName: "notifications:transaction",
				data: {
					type: "TRANSACTION",
					payload: { transactionId: "transaction-1" },
				},
				message: "Transaction updated",
			},
			true,
		);

		expect(createSpy).toHaveBeenCalledWith({
			userId: "offline-user",
			type: "TRANSACTION",
			payload: { transactionId: "transaction-1" },
		});
	});
});
