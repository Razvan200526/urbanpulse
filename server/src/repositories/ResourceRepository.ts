import { db } from "@server/db";
import { type ResourceType, resource } from "@server/db/schema";
import type { GetResourceQuery } from "@shared/validators/resources/isGetResourcesQueryValid";
import { and, eq, ne, sql } from "drizzle-orm";
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

	async getFilteredResources(
		query: GetResourceQuery,
		options: {
			excludeUserId?: string;
		} = {},
	) {
		const filters = [];

		if (query.filter !== "All") {
			filters.push(eq(resource.availability, query.filter));
		}

		if (query.type) {
			filters.push(eq(resource.resourceType, query.type));
		}

		if (options.excludeUserId) {
			filters.push(ne(resource.userId, options.excludeUserId));
		}

		if (query.lat != null && query.long != null) {
			const center = sql`ST_SetSRID(ST_MakePoint(${query.long}, ${query.lat}), 4326)`;

			filters.push(
				sql`ST_DWithin(${resource.position}::geography, ${center}::geography, ${query.radiusMeters})`,
			);
		}

		return await db.query.resource.findMany({
			where: filters.length > 0 ? and(...filters) : undefined,
			with: {
				transactions: {
					orderBy: (transactions, { desc }) => [desc(transactions.startAt)],
					limit: 3,
					with: {
						borrower: {
							columns: { id: true, name: true, image: true },
						},
					},
				},
			},
			orderBy:
				query.lat != null && query.long != null
					? () => [
							sql`ST_Distance(${resource.position}::geography, ST_SetSRID(ST_MakePoint(${query.long}, ${query.lat}), 4326)::geography)`,
						]
					: (resources, { desc }) => [desc(resources.createdAt)],
		});
	}

	async getByOptions(options: Partial<ResourceType>) {
		const filters = Object.entries(options)
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) =>
				eq(resource[key as keyof typeof resource] as any, value),
			);

		return await db.query.resource.findMany({
			where: filters.length > 0 ? and(...filters) : undefined,
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
