import { beforeEach, describe, expect, test } from "bun:test";
import { notificationRepository } from "@server/repositories/NotificationRepository";
import { createNotification, createUser } from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("NotificationRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		const user = await createUser();

		expect(
			await notificationRepository.getOne(
				"00000000-0000-0000-0000-000000000000",
			),
		).toBeNull();

		const created = await notificationRepository.create({
			userId: user.id,
			type: "MESSAGE",
			payload: { body: "hello" },
		});

		expect(created).not.toBeNull();
		expect((await notificationRepository.getOne(created!.id))?.userId).toBe(
			user.id,
		);
		expect(await notificationRepository.getAll()).toHaveLength(1);

		const updated = await notificationRepository.update(created!.id, {
			read: true,
		});
		expect(updated.read).toBe(true);
		await expect(
			notificationRepository.update("00000000-0000-0000-0000-000000000000", {
				read: true,
			}),
		).rejects.toThrow(
			"NotificationRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		expect(await notificationRepository.delete(created!.id)).toBe(true);
		expect(await notificationRepository.delete(created!.id)).toBe(false);
	});

	test("returns notifications for a user in descending creation order", async () => {
		const user = await createUser();
		await createNotification({
			userId: user.id,
			payload: { body: "first" },
			createdAt: new Date("2025-01-01T00:00:00.000Z"),
		});
		await createNotification({
			userId: user.id,
			payload: { body: "second" },
			createdAt: new Date("2025-01-01T00:05:00.000Z"),
		});

		const notifications = await notificationRepository.getByUserId(user.id);
		expect(
			notifications.map((entry) => (entry.payload as { body: string }).body),
		).toEqual(["second", "first"]);
	});

	test("returns joined notification and user rows", async () => {
		const user = await createUser();
		const notification = await createNotification({ userId: user.id });

		const rows = await notificationRepository.getNotificationsWithUsers();
		expect(rows).toHaveLength(1);
		expect(rows[0]?.notification?.id).toBe(notification.id);
		expect(rows[0]?.user?.id).toBe(user.id);
	});
});
