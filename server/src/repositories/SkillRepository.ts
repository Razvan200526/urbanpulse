import { db } from "@server/db";
import { skill, type SkillType } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class SkillRepository implements IRepository<SkillType> {
	async getOne(id: string): Promise<SkillType | null> {
		const [result] = await db.select().from(skill).where(eq(skill.id, id as any));
		return result || null;
	}

	async getAll(): Promise<SkillType[]> {
		return await db.select().from(skill);
	}

	async create(data: Partial<SkillType>): Promise<SkillType | null> {
		const [result] = await db.insert(skill).values(data as any).returning();
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

	async delete(id: string): Promise<any> {
		await db.delete(skill).where(eq(skill.id, id as any));
		return { affected: 1 };
	}
}

export const skillRepository = new SkillRepository();
