import { db } from "@server/db";
import { pulseResponse, type PulseResponseType } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class ResponseRepository implements IRepository<PulseResponseType> {
	async getOne(id: string): Promise<PulseResponseType | null> {
		const [result] = await db.select().from(pulseResponse).where(eq(pulseResponse.id, id as any));
		return result || null;
	}

	async getAll(): Promise<PulseResponseType[]> {
		return await db.select().from(pulseResponse);
	}

	async create(data: Partial<PulseResponseType>): Promise<PulseResponseType | null> {
		const [result] = await db.insert(pulseResponse).values(data as any).returning();
		return result ?? null;
	}

	async update(id: string, data: Partial<PulseResponseType>): Promise<PulseResponseType> {
		const [result] = await db
			.update(pulseResponse)
			.set(data as any)
			.where(eq(pulseResponse.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`ResponseRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<any> {
		await db.delete(pulseResponse).where(eq(pulseResponse.id, id as any));
		return { affected: 1 };
	}
}

export const responseRepository = new ResponseRepository();
