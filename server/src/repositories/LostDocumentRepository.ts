import { db } from "@server/db";
import {
	type LostDocumentMatchType,
	type LostDocumentType,
	lostDocument,
	lostDocumentMatch,
	user,
} from "@server/db/schema";
import { logger } from "@server/utils/Logger";
import { LostDocumentEmbeddingStatusEnum } from "@shared/types";
import { and, count, desc, eq, sql } from "drizzle-orm";
import type { IRepository } from "./IRepository";

const DEFAULT_FEED_LIMIT = 100;

export class LostDocumentRepository implements IRepository<LostDocumentType> {
	async getOne(id: string): Promise<LostDocumentType | null> {
		const [result] = await db
			.select()
			.from(lostDocument)
			.where(eq(lostDocument.id, id as any));
		return result || null;
	}

	async getAll(): Promise<LostDocumentType[]> {
		return await db
			.select()
			.from(lostDocument)
			.orderBy(desc(lostDocument.createdAt));
	}

	async create(
		data: Partial<LostDocumentType>,
	): Promise<LostDocumentType | null> {
		const [result] = await db
			.insert(lostDocument)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(
		id: string,
		data: Partial<LostDocumentType>,
	): Promise<LostDocumentType> {
		const [result] = await db
			.update(lostDocument)
			.set(data as any)
			.where(eq(lostDocument.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`LostDocumentRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(lostDocument)
			.where(eq(lostDocument.id, id as any))
			.returning();
		return affected.length > 0;
	}

	/**
	 * Find documents by user ID
	 * @param userId User ID
	 * @returns Array of lost documents
	 */
	async getByUserId(userId: string): Promise<LostDocumentType[]> {
		return await db
			.select()
			.from(lostDocument)
			.where(eq(lostDocument.userId, userId))
			.orderBy(desc(lostDocument.createdAt));
	}

	/**
	 * Find public lost documents uploaded by other users
	 */
	async getPublicFeed(
		excludeUserId: string,
		limit = DEFAULT_FEED_LIMIT,
	): Promise<LostDocumentType[]> {
		return await db
			.select()
			.from(lostDocument)
			.where(sql`${lostDocument.userId} != ${excludeUserId}`)
			.orderBy(lostDocument.createdAt)
			.limit(limit);
	}

	/**
	 * Count documents uploaded by a user
	 * @param userId User ID
	 * @returns Count of documents
	 */
	async countByUserId(userId: string): Promise<number> {
		const [result] = await db
			.select({ count: count() })
			.from(lostDocument)
			.where(eq(lostDocument.userId, userId));
		return result?.count || 0;
	}

	async getFailedOlderThan(
		olderThan: Date,
		limit = 200,
	): Promise<LostDocumentType[]> {
		return await db
			.select()
			.from(lostDocument)
			.where(
				and(
					eq(
						lostDocument.embeddingStatus,
						LostDocumentEmbeddingStatusEnum.Failed,
					),
					sql`${lostDocument.createdAt} <= ${olderThan}`,
				),
			)
			.orderBy(desc(lostDocument.createdAt))
			.limit(limit);
	}

	/**
	 * Find similar documents using pgvector cosine similarity
	 * @param vector Embedding vector
	 * @param threshold Similarity threshold (0-1)
	 * @param limit Maximum results
	 * @returns Array of documents sorted by similarity
	 */
	async findSimilarByEmbedding(
		vector: number[],
		threshold = 0.7,
		limit = 10,
		excludeDocumentId?: string,
	): Promise<Array<LostDocumentType & { similarity: number }>> {
		try {
			if (vector.length === 0 || !vector.every(Number.isFinite)) {
				return [];
			}

			const vectorStr = `[${vector.map((value) => Number(value).toFixed(8)).join(",")}]`;
			const excludeClause = excludeDocumentId
				? sql`AND ld."id" != ${excludeDocumentId}`
				: sql``;

			const results = await db.execute(sql`
				SELECT
					ld.*,
					(1 - (ld."embeddingVector" <=> ${sql.raw(`'${vectorStr}'::vector`)})) as similarity
				FROM "lost_document" ld
				WHERE ld."embeddingVector" IS NOT NULL
				${excludeClause}
				AND (1 - (ld."embeddingVector" <=> ${sql.raw(`'${vectorStr}'::vector`)})) > ${threshold}
				ORDER BY similarity DESC
				LIMIT ${limit}
			`);

			return results.rows as Array<LostDocumentType & { similarity: number }>;
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Similarity search failed"),
			);
			return [];
		}
	}

	/**
	 * Get matching info with user details
	 * @param documentId Document ID
	 * @param threshold Minimum score threshold
	 * @returns Array of matches with user info
	 */
	async getMatchesWithUserInfo(
		documentId: string,
		threshold = 0.75,
	): Promise<
		Array<
			LostDocumentMatchType & {
				potentialOwner: {
					id: string;
					name: string;
					email: string;
					firstName: string | null;
					lastName: string | null;
				};
			}
		>
	> {
		return await db
			.select({
				id: lostDocumentMatch.id,
				documentId: lostDocumentMatch.documentId,
				potentialOwnerId: lostDocumentMatch.potentialOwnerId,
				similarityScore: lostDocumentMatch.similarityScore,
				compositeScore: lostDocumentMatch.compositeScore,
				nameMatch: lostDocumentMatch.nameMatch,
				birthYearMatch: lostDocumentMatch.birthYearMatch,
				cityMatch: lostDocumentMatch.cityMatch,
				notified: lostDocumentMatch.notified,
				notifiedAt: lostDocumentMatch.notifiedAt,
				createdAt: lostDocumentMatch.createdAt,
				updatedAt: lostDocumentMatch.updatedAt,
				potentialOwner: {
					id: user.id,
					name: user.name,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
				},
			})
			.from(lostDocumentMatch)
			.innerJoin(user, eq(lostDocumentMatch.potentialOwnerId, user.id))
			.where(
				and(
					eq(lostDocumentMatch.documentId, documentId as any),
					sql`${lostDocumentMatch.compositeScore} >= ${threshold}`,
				),
			)
			.orderBy(desc(lostDocumentMatch.compositeScore));
	}

	/**
	 * Create a match record
	 * @param matchData Match data
	 * @returns Created match or null
	 */
	async createMatch(
		matchData: Partial<LostDocumentMatchType>,
	): Promise<LostDocumentMatchType | null> {
		const [result] = await db
			.insert(lostDocumentMatch)
			.values(matchData as any)
			.returning();
		return result ?? null;
	}

	/**
	 * Update a match record
	 * @param id Match ID
	 * @param data Update data
	 * @returns Updated match
	 */
	async updateMatch(
		id: string,
		data: Partial<LostDocumentMatchType>,
	): Promise<LostDocumentMatchType> {
		const [result] = await db
			.update(lostDocumentMatch)
			.set(data as any)
			.where(eq(lostDocumentMatch.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`Match with id ${id} not found`);
		}
		return result;
	}

	/**
	 * Check if a match already exists
	 * @param documentId Document ID
	 * @param potentialOwnerId Potential owner ID
	 * @returns Existing match or null
	 */
	async getExistingMatch(
		documentId: string,
		potentialOwnerId: string,
	): Promise<LostDocumentMatchType | null> {
		const [result] = await db
			.select()
			.from(lostDocumentMatch)
			.where(
				and(
					eq(lostDocumentMatch.documentId, documentId as any),
					eq(lostDocumentMatch.potentialOwnerId, potentialOwnerId),
				),
			);
		return result || null;
	}

	/**
	 * Get unnotified matches for a document
	 * @param documentId Document ID
	 * @returns Array of unnotified matches
	 */
	async getUnnotifiedMatches(
		documentId: string,
	): Promise<LostDocumentMatchType[]> {
		return await db
			.select()
			.from(lostDocumentMatch)
			.where(
				and(
					eq(lostDocumentMatch.documentId, documentId as any),
					eq(lostDocumentMatch.notified, false),
				),
			);
	}

	async getMatchById(matchId: string): Promise<LostDocumentMatchType | null> {
		const [result] = await db
			.select()
			.from(lostDocumentMatch)
			.where(eq(lostDocumentMatch.id, matchId as any));
		return result ?? null;
	}

	/**
	 * Mark matches as notified
	 * @param matchIds Array of match IDs
	 */
	async markAsNotified(matchIds: string[]): Promise<void> {
		if (matchIds.length === 0) return;

		await db
			.update(lostDocumentMatch)
			.set({
				notified: true,
				notifiedAt: new Date(),
			})
			.where(sql`${lostDocumentMatch.id} IN (${sql.join(matchIds, sql`,`)})`);
	}

	async resetNotifiedMatches(documentId: string): Promise<number> {
		const updated = await db
			.update(lostDocumentMatch)
			.set({
				notified: false,
				notifiedAt: null,
				updatedAt: new Date(),
			})
			.where(eq(lostDocumentMatch.documentId, documentId as any))
			.returning({ id: lostDocumentMatch.id });

		return updated.length;
	}
}

export const lostDocumentRepository = new LostDocumentRepository();
