import { db } from "@server/db";
import { type ReportType, report } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class ReportRepository implements IRepository<ReportType> {
	async getOne(id: string): Promise<ReportType | null> {
		const [result] = await db
			.select()
			.from(report)
			.where(eq(report.id, id as any));
		return result || null;
	}

	async getAll(): Promise<ReportType[]> {
		return await db.select().from(report);
	}

	async create(data: Partial<ReportType>): Promise<ReportType | null> {
		const [result] = await db
			.insert(report)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(id: string, data: Partial<ReportType>): Promise<ReportType> {
		const [result] = await db
			.update(report)
			.set(data as any)
			.where(eq(report.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`ReportRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(report)
			.where(eq(report.id, id as any))
			.returning();
		return affected.length > 0;
	}
}

export const reportRepository = new ReportRepository();
