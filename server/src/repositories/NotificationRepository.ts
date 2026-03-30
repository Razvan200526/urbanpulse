import { db } from "@server/db";
import { type NotificationType, notification, user } from "@server/db/schema";
import { desc, eq } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class NotificationRepository implements IRepository<NotificationType> {
	async getOne(id: string): Promise<NotificationType | null> {
		const [result] = await db
			.select()
			.from(notification)
			.where(eq(notification.id, id as any));
		return result || null;
	}

	async getByUserId(userId: string): Promise<NotificationType[]> {
		return db
			.select()
			.from(notification)
			.where(eq(notification.userId, userId))
			.orderBy(desc(notification.createdAt));
	}

	async getAll(): Promise<NotificationType[]> {
		return db.select().from(notification);
	}

	async getNotificationsWithUsers() {
		return db
			.select()
			.from(notification)
			.fullJoin(user, eq(notification.userId, user.id))
			.orderBy(desc(notification.createdAt));
	}

	async getNotificationsWithUsersByUserId(userId: string) {
		return db
			.select()
			.from(notification)
			.fullJoin(user, eq(notification.userId, user.id))
			.where(eq(notification.userId, userId))
			.orderBy(desc(notification.createdAt));
	}

	async create(
		data: Partial<NotificationType>,
	): Promise<NotificationType | null> {
		const [result] = await db
			.insert(notification)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(
		id: string,
		data: Partial<NotificationType>,
	): Promise<NotificationType> {
		const [result] = await db
			.update(notification)
			.set(data as any)
			.where(eq(notification.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`NotificationRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(notification)
			.where(eq(notification.id, id as any))
			.returning();
		return affected.length > 0;
	}
}

export const notificationRepository = new NotificationRepository();
