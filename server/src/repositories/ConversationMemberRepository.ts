import { db } from "@server/db";
import {
	type ConversationMemberType,
	conversationMember,
} from "@server/db/schema";
import { and, eq } from "drizzle-orm";
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
		return db.select().from(conversationMember);
	}

	async getByConversationId(
		conversationId: string,
	): Promise<ConversationMemberType[]> {
		return await db
			.select()
			.from(conversationMember)
			.where(eq(conversationMember.conversationId, conversationId as any));
	}

	async getByUserId(userId: string): Promise<ConversationMemberType[]> {
		return await db
			.select()
			.from(conversationMember)
			.where(eq(conversationMember.userId, userId));
	}

	async findByConversationAndUser(
		conversationId: string,
		userId: string,
	): Promise<ConversationMemberType | null> {
		const [result] = await db
			.select()
			.from(conversationMember)
			.where(
				and(
					eq(conversationMember.conversationId, conversationId as any),
					eq(conversationMember.userId, userId),
				),
			);
		return result || null;
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

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(conversationMember)
			.where(eq(conversationMember.id, id as any))
			.returning();
		return affected.length > 0;
	}
}

export const conversationMemberRepository = new ConversationMemberRepository();
