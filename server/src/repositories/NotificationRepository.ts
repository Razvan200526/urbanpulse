import { db } from "@server/db";
import { type NotificationType, notification } from "@server/db/schema";
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
		return await db
			.select()
			.from(notification)
			.where(eq(notification.userId, userId))
			.orderBy(desc(notification.createdAt));
	}

	async getAll(): Promise<NotificationType[]> {
		return await db.select().from(notification);
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

	async delete(id: string): Promise<any> {
		await db.delete(notification).where(eq(notification.id, id as any));
		return { affected: 1 };
	}
}

export const notificationRepository = new NotificationRepository();
