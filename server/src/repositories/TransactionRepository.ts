import { db } from "@server/db";
import { type TransactionType, transaction } from "@server/db/schema";
import { TransactionStatusEnum } from "@shared/types";
import { and, desc, eq, ne } from "drizzle-orm";
import type { IRepository } from "./IRepository";

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
					eq(transaction.status, TransactionStatusEnum.Pending as any),
				),
			);
	}

	async getPendingByResourceId(resourceId: string): Promise<TransactionType[]> {
		return await db
			.select()
			.from(transaction)
			.where(
				and(
					eq(transaction.resourceId, resourceId as any),
					eq(transaction.status, TransactionStatusEnum.Pending as any),
				),
			)
			.orderBy(desc(transaction.startAt));
	}

	async getByResourceAndBorrowerId(
		resourceId: string,
		borrowerId: string,
	): Promise<TransactionType[]> {
		return await db
			.select()
			.from(transaction)
			.where(
				and(
					eq(transaction.resourceId, resourceId as any),
					eq(transaction.borrowerId, borrowerId as any),
				),
			)
			.orderBy(desc(transaction.startAt));
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

	async cancelPendingByResourceId(
		resourceId: string,
		exceptTransactionId: string,
	): Promise<TransactionType[]> {
		return await db
			.update(transaction)
			.set({ status: TransactionStatusEnum.Cancelled as any })
			.where(
				and(
					eq(transaction.resourceId, resourceId as any),
					eq(transaction.status, TransactionStatusEnum.Pending as any),
					ne(transaction.id, exceptTransactionId as any),
				),
			)
			.returning();
	}

	async delete(id: string): Promise<boolean> {
		const affected = await db
			.delete(transaction)
			.where(eq(transaction.id, id as any))
			.returning();
		return affected.length > 0;
	}
}

export const transactionRepository = new TransactionRepository();
