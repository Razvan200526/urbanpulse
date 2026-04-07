import { db } from "@server/db";
import { type MessageReceiptType, messageReceipt } from "@server/db/schema";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";

export class MessageReceiptRepository {
	async getByMessageIds(messageIds: string[]): Promise<MessageReceiptType[]> {
		if (messageIds.length === 0) {
			return [];
		}

		return await db
			.select()
			.from(messageReceipt)
			.where(inArray(messageReceipt.messageId, messageIds as any));
	}

	async getByUserAndMessageIds(params: {
		userId: string;
		messageIds: string[];
	}): Promise<MessageReceiptType[]> {
		if (params.messageIds.length === 0) {
			return [];
		}

		return await db
			.select()
			.from(messageReceipt)
			.where(
				and(
					eq(messageReceipt.userId, params.userId),
					inArray(messageReceipt.messageId, params.messageIds as any),
				),
			);
	}

	async createMany(
		receipts: Array<
			Pick<MessageReceiptType, "messageId" | "userId"> & {
				deliveredAt?: Date | null;
				readAt?: Date | null;
			}
		>,
	) {
		if (receipts.length === 0) {
			return [];
		}

		return await db
			.insert(messageReceipt)
			.values(receipts as any)
			.onConflictDoNothing({
				target: [messageReceipt.messageId, messageReceipt.userId],
			})
			.returning();
	}

	async markDelivered(params: {
		messageIds: string[];
		userId: string;
		deliveredAt: Date;
	}) {
		if (params.messageIds.length === 0) {
			return [];
		}

		return await db
			.update(messageReceipt)
			.set({ deliveredAt: params.deliveredAt })
			.where(
				and(
					eq(messageReceipt.userId, params.userId),
					inArray(messageReceipt.messageId, params.messageIds as any),
					isNull(messageReceipt.deliveredAt),
				),
			)
			.returning();
	}

	async markRead(params: {
		messageIds: string[];
		userId: string;
		readAt: Date;
	}) {
		if (params.messageIds.length === 0) {
			return [];
		}

		return await db
			.update(messageReceipt)
			.set({
				deliveredAt: sql`coalesce(${messageReceipt.deliveredAt}, ${params.readAt})`,
				readAt: params.readAt,
			})
			.where(
				and(
					eq(messageReceipt.userId, params.userId),
					inArray(messageReceipt.messageId, params.messageIds as any),
					isNull(messageReceipt.readAt),
				),
			)
			.returning();
	}
}

export const messageReceiptRepository = new MessageReceiptRepository();
