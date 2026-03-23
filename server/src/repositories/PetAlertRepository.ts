import { db } from "@server/db";
import { type PetAlertType, petAlert } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class PetAlertRepository implements IRepository<PetAlertType> {
	async getOne(id: string): Promise<PetAlertType | null> {
		const [result] = await db
			.select()
			.from(petAlert)
			.where(eq(petAlert.id, id as any));
		return result || null;
	}

	async getAll(): Promise<PetAlertType[]> {
		return await db.select().from(petAlert);
	}

	async create(data: Partial<PetAlertType>): Promise<PetAlertType | null> {
		const [result] = await db
			.insert(petAlert)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(id: string, data: Partial<PetAlertType>): Promise<PetAlertType> {
		const [result] = await db
			.update(petAlert)
			.set(data as any)
			.where(eq(petAlert.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`PetAlertRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<any> {
		await db.delete(petAlert).where(eq(petAlert.id, id as any));
		return { affected: 1 };
	}
}

export const petAlertRepository = new PetAlertRepository();
