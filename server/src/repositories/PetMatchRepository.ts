import { db } from "@server/db";
import { petMatch, type PetMatchType } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class PetMatchRepository implements IRepository<PetMatchType> {
	async getOne(id: string): Promise<PetMatchType | null> {
		const [result] = await db.select().from(petMatch).where(eq(petMatch.id, id as any));
		return result || null;
	}

	async getAll(): Promise<PetMatchType[]> {
		return await db.select().from(petMatch);
	}

	async create(data: Partial<PetMatchType>): Promise<PetMatchType | null> {
		const [result] = await db.insert(petMatch).values(data as any).returning();
		return result ?? null;
	}

	async update(id: string, data: Partial<PetMatchType>): Promise<PetMatchType> {
		const [result] = await db
			.update(petMatch)
			.set(data as any)
			.where(eq(petMatch.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`PetMatchRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<any> {
		await db.delete(petMatch).where(eq(petMatch.id, id as any));
		return { affected: 1 };
	}
}

export const petMatchRepository = new PetMatchRepository();
