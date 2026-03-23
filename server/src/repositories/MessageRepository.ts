import { db } from "@server/db";
import { type MessageType, message } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class MessageRepository implements IRepository<MessageType> {
	async getOne(id: string): Promise<MessageType | null> {
		const [result] = await db
			.select()
			.from(message)
			.where(eq(message.id, id as any));
		return result || null;
	}

	async getAll(): Promise<MessageType[]> {
		return await db.select().from(message);
	}

	async create(data: Partial<MessageType>): Promise<MessageType | null> {
		const [result] = await db
			.insert(message)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(id: string, data: Partial<MessageType>): Promise<MessageType> {
		const [result] = await db
			.update(message)
			.set(data as any)
			.where(eq(message.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`MessageRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<any> {
		await db.delete(message).where(eq(message.id, id as any));
		return { affected: 1 };
	}
}

export const messageRepository = new MessageRepository();
