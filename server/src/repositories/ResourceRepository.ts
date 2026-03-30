import { db } from "@server/db";
import { type ResourceType, resource } from "@server/db/schema";
import { eq } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class ResourceRepository implements IRepository<ResourceType> {
	async getOne(id: string): Promise<ResourceType | null> {
		const [result] = await db
			.select()
			.from(resource)
			.where(eq(resource.id, id as any));
		return result || null;
	}

	async getAll() {
		return await db.query.resource.findMany({
			with: {
				transactions: {
					orderBy: (transactions, { desc }) => [desc(transactions.startAt)],
					limit: 3,
					with: {
						borrower: {
							columns: {
								id: true,
								name: true,
								image: true,
							},
						},
					},
				},
			},
			orderBy: (resources, { desc }) => [desc(resources.createdAt)],
		});
	}

	async create(data: Partial<ResourceType>): Promise<ResourceType | null> {
		const [result] = await db
			.insert(resource)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(id: string, data: Partial<ResourceType>): Promise<ResourceType> {
		const [result] = await db
			.update(resource)
			.set(data as any)
			.where(eq(resource.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`ResourceRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(resource)
			.where(eq(resource.id, id as any))
			.returning();
		return affected.length > 0;
	}
}

export const resourceRepository = new ResourceRepository();
