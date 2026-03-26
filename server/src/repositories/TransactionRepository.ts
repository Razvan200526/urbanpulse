import { db } from "@server/db";
import { type TransactionType, transaction } from "@server/db/schema";
import { eq, and } from "drizzle-orm";
import type { IRepository } from "./IRepository";
import { TransactionStatusEnum } from "@shared/types";

export class TransactionRepository implements IRepository<TransactionType> {
	async getOne(id: string): Promise<TransactionType | null> {
		const [result] = await db
			.select()
			.from(transaction)
			.where(eq(transaction.id, id as any));
		return result || null;
	}

	async getAll(): Promise<TransactionType[]> {
		return await db.select().from(transaction);
	}

	async getPendingByLenderId(lenderId: string): Promise<TransactionType[]> {
		return await db
			.select()
			.from(transaction)
			.where(
				and(
					eq(transaction.lenderId, lenderId as any),
					eq(transaction.status, TransactionStatusEnum.Pending as any)
				)
			);
	}

	async create(
		data: Partial<TransactionType>,
	): Promise<TransactionType | null> {
		const [result] = await db
			.insert(transaction)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(
		id: string,
		data: Partial<TransactionType>,
	): Promise<TransactionType> {
		const [result] = await db
			.update(transaction)
			.set(data as any)
			.where(eq(transaction.id, id as any))
			.returning();
		if (!result) {
			throw new Error(`TransactionRepository: Record with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<any> {
		await db.delete(transaction).where(eq(transaction.id, id as any));
		return { affected: 1 };
	}
}

export const transactionRepository = new TransactionRepository();
