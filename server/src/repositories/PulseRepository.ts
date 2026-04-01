import { db } from "@server/db";
import { type PulseType, pulse } from "@server/db/schema";
import type {
	PulseConditionOptions,
	PulseSearchOptions,
} from "@server/repositories/types";
import { handleError } from "@server/utils/handleError";
import { logger } from "@server/utils/Logger";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { IRepository } from "./IRepository";

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

	/**
	 * Retrieves pulses by optional field filters and optional createdAt range condition.
	 * @param {PulseSearchOptions} options - Column filters and optional geo filters.
	 * @param {PulseConditionOptions} [condition] - Optional createdAt range condition.
	 * @returns {Promise<PulseType[]>} Matching pulse records.
	 */
	async getByOptions(
		options: PulseSearchOptions,
		condition?: PulseConditionOptions,
	): Promise<PulseType[]> {
		try {
			const { x, y, radius, ...rest } = options;
			const filters = [];

			if (x !== undefined && y !== undefined && radius !== undefined) {
				filters.push(
					sql`ST_DWithin(${pulse.position}::geography, ST_SetSRID(ST_MakePoint(${x}, ${y}), 4326)::geography, ${radius})`,
				);
			}

			for (const [key, value] of Object.entries(rest)) {
				if (value !== undefined) {
					filters.push(eq(pulse[key as keyof typeof pulse] as any, value));
				}
			}

			if (condition?.createdAtFrom) {
				filters.push(gte(pulse.createdAt, condition.createdAtFrom));
			}

			if (condition?.createdAtTo) {
				filters.push(lt(pulse.createdAt, condition.createdAtTo));
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

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(pulse)
			.where(eq(pulse.id, id as any))
			.returning();
		return affected.length > 0;
	}
}

export const pulseRepository = new PulseRepository();
