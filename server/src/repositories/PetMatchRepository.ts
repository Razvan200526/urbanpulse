import { db } from "@server/db";
import { type PetMatchType, petMatch } from "@server/db/schema";
import { and, desc, eq, or } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class PetMatchRepository implements IRepository<PetMatchType> {
	async getOne(id: string): Promise<PetMatchType | null> {
		const [result] = await db
			.select()
			.from(petMatch)
			.where(eq(petMatch.id, id as any));
		return result || null;
	}

	async getAll(): Promise<PetMatchType[]> {
		return await db.select().from(petMatch);
	}

	async listByAlertId(alertId: string): Promise<PetMatchType[]> {
		return await db
			.select()
			.from(petMatch)
			.where(
				or(
					eq(petMatch.lostAlertId, alertId as any),
					eq(petMatch.foundAlertId, alertId as any),
				),
			)
			.orderBy(
				desc(petMatch.updatedAt),
				desc(petMatch.confidenceScore),
				desc(petMatch.imageSimilarity),
			);
	}

	async getByPair(params: {
		lostAlertId: string;
		foundAlertId: string;
	}): Promise<PetMatchType | null> {
		const [result] = await db
			.select()
			.from(petMatch)
			.where(
				and(
					eq(petMatch.lostAlertId, params.lostAlertId as any),
					eq(petMatch.foundAlertId, params.foundAlertId as any),
				),
			)
			.limit(1);

		return result ?? null;
	}

	async create(data: Partial<PetMatchType>): Promise<PetMatchType | null> {
		const [result] = await db
			.insert(petMatch)
			.values(data as any)
			.returning();
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

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(petMatch)
			.where(eq(petMatch.id, id as any))
			.returning();
		return affected.length > 0;
	}
}

export const petMatchRepository = new PetMatchRepository();
