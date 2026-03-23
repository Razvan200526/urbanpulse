import { db } from "@server/db";
import {
	type ConversationMemberType,
	conversationMember,
} from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class ConversationMemberRepository
	implements IRepository<ConversationMemberType>
{
	async getOne(id: string): Promise<ConversationMemberType | null> {
		const [result] = await db
			.select()
			.from(conversationMember)
			.where(eq(conversationMember.id, id as any));
		return result || null;
	}

	async getAll(): Promise<ConversationMemberType[]> {
		return await db.select().from(conversationMember);
	}

	async create(
		data: Partial<ConversationMemberType>,
	): Promise<ConversationMemberType | null> {
		const [result] = await db
			.insert(conversationMember)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(
		id: string,
		data: Partial<ConversationMemberType>,
	): Promise<ConversationMemberType> {
		const [result] = await db
			.update(conversationMember)
			.set(data as any)
			.where(eq(conversationMember.id, id as any))
			.returning();
		if (!result) {
			throw new Error(
				`ConversationMemberRepository: Record with id ${id} not found`,
			);
		}
		return result;
	}

	async delete(id: string): Promise<any> {
		await db
			.delete(conversationMember)
			.where(eq(conversationMember.id, id as any));
		return { affected: 1 };
	}
}

export const conversationMemberRepository = new ConversationMemberRepository();
