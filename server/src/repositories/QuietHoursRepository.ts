import { db } from "@server/db";
import { type QuietHoursType, quietHours } from "@server/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class QuietHoursRepository implements IRepository<QuietHoursType> {
	async getOne(id: string): Promise<QuietHoursType | null> {
		const [result] = await db
			.select()
			.from(quietHours)
			.where(eq(quietHours.id, id as any));
		return result || null;
	}

	async getAll(): Promise<QuietHoursType[]> {
		return await db.select().from(quietHours);
	}

	async findByUserId(userId: string): Promise<QuietHoursType | null> {
		const [result] = await db
			.select()
			.from(quietHours)
			.where(eq(quietHours.userId, userId));
		return result || null;
	}

	async findByUserIds(userIds: string[]): Promise<QuietHoursType[]> {
		if (userIds.length === 0) {
			return [];
		}

		return await db
			.select()
			.from(quietHours)
			.where(inArray(quietHours.userId, userIds));
	}

	async create(data: Partial<QuietHoursType>): Promise<QuietHoursType | null> {
		const [result] = await db
			.insert(quietHours)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(
		id: string,
		data: Partial<QuietHoursType>,
	): Promise<QuietHoursType> {
		const [result] = await db
			.update(quietHours)
			.set(data as any)
			.where(eq(quietHours.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`QuietHoursRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(quietHours)
			.where(eq(quietHours.id, id as any))
			.returning();
		return affected.length > 0;
	}
}

export const quietHoursRepository = new QuietHoursRepository();
