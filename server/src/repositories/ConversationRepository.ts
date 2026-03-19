import { db } from "@server/db";
import { conversation, type ConversationType } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class ConversationRepository implements IRepository<ConversationType> {
	async getOne(id: string): Promise<ConversationType | null> {
		const [result] = await db
			.select()
			.from(conversation)
			.where(eq(conversation.id, id as any));
		return result || null;
	}

	async getAll(): Promise<ConversationType[]> {
		return await db.select().from(conversation);
	}

	async create(
		data: Partial<ConversationType>,
	): Promise<ConversationType | null> {
		const [result] = await db
			.insert(conversation)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(
		id: string,
		data: Partial<ConversationType>,
	): Promise<ConversationType> {
		const [result] = await db
			.update(conversation)
			.set(data as any)
			.where(eq(conversation.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`ConversationRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<any> {
		await db.delete(conversation).where(eq(conversation.id, id as any));
		return { affected: 1 };
	}
}

export const conversationRepository = new ConversationRepository();
