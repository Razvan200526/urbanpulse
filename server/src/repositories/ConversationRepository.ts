import { db } from "@server/db";
import { type ConversationType, conversation } from "@server/db/schema";
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
		return db.select().from(conversation);
	}

	async findByPulseId(pulseId: string): Promise<ConversationType | null> {
		const [result] = await db
			.select()
			.from(conversation)
			.where(eq(conversation.pulseId, pulseId as any));
		return result || null;
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

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(conversation)
			.where(eq(conversation.id, id as any))
			.returning();
		return affected.length > 0;
	}
}

export const conversationRepository = new ConversationRepository();
