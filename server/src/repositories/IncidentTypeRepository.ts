import { db } from "@server/db";
import { type IncidentTypeType, incidentType } from "@server/db/schema";
import { handleError } from "@server/utils/handleError";
import { logger } from "@server/utils/Logger";
import { asc, eq } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class IncidentTypeRepository implements IRepository<IncidentTypeType> {
	async getOne(id: string): Promise<IncidentTypeType | null> {
		const [result] = await db
			.select()
			.from(incidentType)
			.where(eq(incidentType.id, id as any));
		return result || null;
	}

	async getBySlug(slug: string): Promise<IncidentTypeType | null> {
		const [result] = await db
			.select()
			.from(incidentType)
			.where(eq(incidentType.slug, slug));
		return result || null;
	}

	async getAll(): Promise<IncidentTypeType[]> {
		return await db
			.select()
			.from(incidentType)
			.orderBy(asc(incidentType.sortOrder), asc(incidentType.label));
	}

	async getActive(): Promise<IncidentTypeType[]> {
		return await db
			.select()
			.from(incidentType)
			.orderBy(asc(incidentType.sortOrder), asc(incidentType.label));
	}

	async create(
		data: Partial<IncidentTypeType>,
	): Promise<IncidentTypeType | null> {
		try {
			const [result] = await db
				.insert(incidentType)
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

	async update(
		id: string,
		data: Partial<IncidentTypeType>,
	): Promise<IncidentTypeType> {
		const [result] = await db
			.update(incidentType)
			.set({ ...data, updatedAt: new Date() } as any)
			.where(eq(incidentType.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`IncidentTypeRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<boolean> {
		try {
			await this.update(id, { isActive: false });
			return true;
		} catch (error) {
			handleError(error);
			return false;
		}
	}
}

export const incidentTypeRepository = new IncidentTypeRepository();
