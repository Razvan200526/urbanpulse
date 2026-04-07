import { db } from "@server/db";
import { type ResourceReviewType, resourceReview } from "@server/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export type ResourceReviewSummary = {
	averageRating: number | null;
	count: number;
};

export class ResourceReviewRepository
	implements IRepository<ResourceReviewType>
{
	async getOne(id: string): Promise<ResourceReviewType | null> {
		const [result] = await db
			.select()
			.from(resourceReview)
			.where(eq(resourceReview.id, id as any));
		return result || null;
	}

	async getAll(): Promise<ResourceReviewType[]> {
		return await db.select().from(resourceReview);
	}

	async getByTransactionId(
		transactionId: string,
	): Promise<ResourceReviewType | null> {
		const [result] = await db
			.select()
			.from(resourceReview)
			.where(eq(resourceReview.transactionId, transactionId as any));
		return result || null;
	}

	async getLatestByRevieweeId(
		revieweeId: string,
	): Promise<ResourceReviewType[]> {
		return await db
			.select()
			.from(resourceReview)
			.where(eq(resourceReview.revieweeId, revieweeId as any))
			.orderBy(desc(resourceReview.createdAt));
	}

	async getSummaryByResourceId(
		resourceId: string,
	): Promise<ResourceReviewSummary> {
		const [result] = await db
			.select({
				averageRating: sql<number | null>`avg(${resourceReview.rating})`,
				count: sql<number>`count(${resourceReview.id})`,
			})
			.from(resourceReview)
			.where(eq(resourceReview.resourceId, resourceId as any));

		return {
			averageRating:
				result?.averageRating == null ? null : Number(result.averageRating),
			count: Number(result?.count ?? 0),
		};
	}

	async create(
		data: Partial<ResourceReviewType>,
	): Promise<ResourceReviewType | null> {
		const [result] = await db
			.insert(resourceReview)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(
		id: string,
		data: Partial<ResourceReviewType>,
	): Promise<ResourceReviewType> {
		const [result] = await db
			.update(resourceReview)
			.set(data as any)
			.where(eq(resourceReview.id, id as any))
			.returning();
		if (!result) {
			throw new Error(
				`ResourceReviewRepository: Record with id ${id} not found`,
			);
		}
		return result;
	}

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(resourceReview)
			.where(eq(resourceReview.id, id as any))
			.returning();
		return affected.length > 0;
	}
}

export const resourceReviewRepository = new ResourceReviewRepository();
