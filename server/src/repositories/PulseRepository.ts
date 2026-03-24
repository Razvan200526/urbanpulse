import { db } from "@server/db";
import { type PulseType, pulse } from "@server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { IRepository } from "./IRepository";
import { logger } from "@server/utils/Logger";
import { handleError } from "@server/utils/handleError";

export interface PulseSearchOptions extends Partial<PulseType> {
	lat?: number;
	lng?: number;
	radius?: number; // in meters
}

export class PulseRepository implements IRepository<PulseType> {
	async getOne(id: string): Promise<PulseType | null> {
		const [result] = await db
			.select()
			.from(pulse)
			.where(eq(pulse.id, id as any));
		return result || null;
	}

	async getAll(): Promise<PulseType[]> {
		return await db.select().from(pulse);
	}

	async getByOptions(options: PulseSearchOptions): Promise<PulseType[]> {
		try {
			const { lat, lng, radius, ...rest } = options;
			const filters = [];

			if (lat !== undefined && lng !== undefined && radius !== undefined) {
				filters.push(
					sql`ST_DWithin(${pulse.position}::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radius})`,
				);
			}

			for (const [key, value] of Object.entries(rest)) {
				if (value !== undefined) {
					filters.push(eq(pulse[key as keyof typeof pulse.column], value));
				}
			}

			return await db
				.select()
				.from(pulse)
				.where(filters.length > 0 ? and(...filters) : undefined);
		} catch (error) {
			handleError(error);
			return [];
		}
	}

	async create(data: Partial<PulseType>): Promise<PulseType | null> {
		try {
			const [result] = await db
				.insert(pulse)
				.values(data as any)
				.returning();
			return result ?? null;
		} catch (error) {
			if (error instanceof Error) {
				logger.exception(error);
			}
			console.error(error);
			return null;
		}
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
