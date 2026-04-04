import { db } from "@server/db";
import { type SkillType, skill } from "@server/db/schema";
import { asc, eq, inArray } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class SkillRepository implements IRepository<SkillType> {
	async getOne(id: string): Promise<SkillType | null> {
		const [result] = await db
			.select()
			.from(skill)
			.where(eq(skill.id, id as any));
		return result || null;
	}

	async getAll(): Promise<SkillType[]> {
		return await db.select().from(skill);
	}

	async getByUserId(userId: string): Promise<SkillType[]> {
		return await db.select().from(skill).where(eq(skill.userId, userId));
	}

	async getByUserIds(userIds: string[]): Promise<SkillType[]> {
		if (userIds.length === 0) {
			return [];
		}

		return await db.select().from(skill).where(inArray(skill.userId, userIds));
	}

	async getDistinctTags(): Promise<string[]> {
		const rows = await db
			.selectDistinct({ tag: skill.tag })
			.from(skill)
			.orderBy(asc(skill.tag));
		return rows.map((row) => row.tag);
	}

	async create(data: Partial<SkillType>): Promise<SkillType | null> {
		const [result] = await db
			.insert(skill)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(id: string, data: Partial<SkillType>): Promise<SkillType> {
		const [result] = await db
			.update(skill)
			.set(data as any)
			.where(eq(skill.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`SkillRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(skill)
			.where(eq(skill.id, id as any))
			.returning();
		return affected.length > 0;
	}

	async deleteByUserId(userId: string): Promise<number> {
		const affected = await db
			.delete(skill)
			.where(eq(skill.userId, userId))
			.returning();
		return affected.length;
	}
}

export const skillRepository = new SkillRepository();
