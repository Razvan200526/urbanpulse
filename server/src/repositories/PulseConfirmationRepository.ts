import { db } from "@server/db";
import {
	type PulseConfirmationType,
	pulseConfirmation,
} from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class PulseConfirmationRepository
	implements IRepository<PulseConfirmationType>
{
	async getOne(id: string): Promise<PulseConfirmationType | null> {
		const [result] = await db
			.select()
			.from(pulseConfirmation)
			.where(eq(pulseConfirmation.id, id as any));
		return result || null;
	}

	async getAll(): Promise<PulseConfirmationType[]> {
		return await db.select().from(pulseConfirmation);
	}

	async create(
		data: Partial<PulseConfirmationType>,
	): Promise<PulseConfirmationType | null> {
		const [result] = await db
			.insert(pulseConfirmation)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(
		id: string,
		data: Partial<PulseConfirmationType>,
	): Promise<PulseConfirmationType> {
		const [result] = await db
			.update(pulseConfirmation)
			.set(data as any)
			.where(eq(pulseConfirmation.id, id as any))
			.returning();
		if (!result) {
			throw new Error(
				`PulseConfirmationRepository: Record with id ${id} not found`,
			);
		}
		return result;
	}

	async delete(id: string): Promise<any> {
		await db
			.delete(pulseConfirmation)
			.where(eq(pulseConfirmation.id, id as any));
		return { affected: 1 };
	}
}

export const pulseConfirmationRepository = new PulseConfirmationRepository();
