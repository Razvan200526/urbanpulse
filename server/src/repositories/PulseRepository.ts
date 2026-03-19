import { db } from "@server/db";
import { pulse, type PulseType } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class PulseRepository implements IRepository<PulseType> {
	async getOne(id: string): Promise<PulseType | null> {
		const [result] = await db.select().from(pulse).where(eq(pulse.id, id as any));
		return result || null;
	}

	async getAll(): Promise<PulseType[]> {
		return await db.select().from(pulse);
	}

	async create(data: Partial<PulseType>): Promise<PulseType | null> {
		const [result] = await db.insert(pulse).values(data as any).returning();
		return result ?? null;
	}

	async update(id: string, data: Partial<PulseType>): Promise<PulseType> {
		const [result] = await db
			.update(pulse)
			.set(data as any)
			.where(eq(pulse.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`PulseRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<any> {
		await db.delete(pulse).where(eq(pulse.id, id as any));
		return { affected: 1 };
	}
}

export const pulseRepository = new PulseRepository();
