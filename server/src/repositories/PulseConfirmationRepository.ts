import { db } from "@server/db";
import {
	type PulseConfirmationType,
	pulseConfirmation,
} from "@server/db/schema";
import { and, count, eq } from "drizzle-orm";
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

	async getByPulseId(pulseId: string): Promise<PulseConfirmationType[]> {
		return await db
			.select()
			.from(pulseConfirmation)
			.where(eq(pulseConfirmation.pulseId, pulseId as any));
	}

	async findByPulseAndUser(
		pulseId: string,
		userId: string,
	): Promise<PulseConfirmationType | null> {
		const [result] = await db
			.select()
			.from(pulseConfirmation)
			.where(
				and(
					eq(pulseConfirmation.pulseId, pulseId as any),
					eq(pulseConfirmation.userId, userId),
				),
			)
			.limit(1);

		return result ?? null;
	}

	async countByPulseId(pulseId: string): Promise<number> {
		const [result] = await db
			.select({ value: count() })
			.from(pulseConfirmation)
			.where(eq(pulseConfirmation.pulseId, pulseId as any));

		return Number(result?.value ?? 0);
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

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(pulseConfirmation)
			.where(eq(pulseConfirmation.id, id as any))
			.returning();
		return affected.length > 0;
	}
}

export const pulseConfirmationRepository = new PulseConfirmationRepository();
