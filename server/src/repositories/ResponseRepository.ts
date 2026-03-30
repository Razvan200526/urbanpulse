import { db } from "@server/db";
import { type PulseResponseType, pulseResponse } from "@server/db/schema";
import { ResponseStatusEnum } from "@shared/types";
import { and, eq, ne } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class ResponseRepository implements IRepository<PulseResponseType> {
	async getOne(id: string): Promise<PulseResponseType | null> {
		const [result] = await db
			.select()
			.from(pulseResponse)
			.where(eq(pulseResponse.id, id as any));
		return result || null;
	}

	async getAll(): Promise<PulseResponseType[]> {
		return await db.select().from(pulseResponse);
	}

	async findByPulseAndResponder(
		pulseId: string,
		responderId: string,
	): Promise<PulseResponseType | null> {
		const [row] = await db
			.select()
			.from(pulseResponse)
			.where(
				and(
					eq(pulseResponse.pulseId, pulseId as any),
					eq(pulseResponse.responderId, responderId),
				),
			)
			.limit(1);
		return row ?? null;
	}

	async create(
		data: Partial<PulseResponseType>,
	): Promise<PulseResponseType | null> {
		const [result] = await db
			.insert(pulseResponse)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async declineOtherPendingForPulse(
		pulseId: string,
		acceptedResponseId: string,
	): Promise<void> {
		await db
			.update(pulseResponse)
			.set({ status: ResponseStatusEnum.Declined })
			.where(
				and(
					eq(pulseResponse.pulseId, pulseId as any),
					eq(pulseResponse.status, ResponseStatusEnum.Pending),
					ne(pulseResponse.id, acceptedResponseId as any),
				),
			);
	}

	async update(
		id: string,
		data: Partial<PulseResponseType>,
	): Promise<PulseResponseType> {
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

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(pulseResponse)
			.where(eq(pulseResponse.id, id as any))
			.returning();
		return affected.length > 0;
	}
}

export const responseRepository = new ResponseRepository();
