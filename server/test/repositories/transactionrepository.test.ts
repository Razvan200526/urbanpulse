import { beforeEach, describe, expect, test } from "bun:test";
import { transactionRepository } from "@server/repositories/TransactionRepository";
import { TransactionStatusEnum } from "@shared/types";
import {
	createResource,
	createTransaction,
	createUser,
} from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("TransactionRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		const lender = await createUser();
		const borrower = await createUser();
		const resource = await createResource();
		const created = await transactionRepository.create({
			resourceId: resource.id,
			lenderId: lender.id,
			borrowerId: borrower.id,
			status: TransactionStatusEnum.Pending,
			startAt: new Date("2025-01-01T00:00:00.000Z"),
		});

		expect(created).not.toBeNull();
		expect((await transactionRepository.getOne(created!.id))?.id).toBe(
			created!.id,
		);
		expect(
			await transactionRepository.getOne(
				"00000000-0000-0000-0000-000000000000",
			),
		).toBeNull();

		const updated = await transactionRepository.update(created!.id, {
			status: TransactionStatusEnum.Active,
		});
		expect(updated.status).toBe(TransactionStatusEnum.Active);
		expect(
			transactionRepository.update("00000000-0000-0000-0000-000000000000", {
				status: TransactionStatusEnum.Cancelled,
			}),
		).rejects.toThrow(
			"TransactionRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		expect(await transactionRepository.delete(created!.id)).toBe(true);
		expect(await transactionRepository.delete(created!.id)).toBe(false);
	});

	test("returns pending transactions for a lender", async () => {
		const lender = await createUser();
		await createTransaction({
			lenderId: lender.id,
			status: TransactionStatusEnum.Pending,
		});
		await createTransaction({
			lenderId: lender.id,
			status: TransactionStatusEnum.Active,
		});
		await createTransaction({ status: TransactionStatusEnum.Pending });

		const pending = await transactionRepository.getPendingByLenderId(lender.id);
		expect(pending).toHaveLength(1);
		expect(pending[0]?.status).toBe(TransactionStatusEnum.Pending);
	});

	test("returns all transactions", async () => {
		await createTransaction();
		await createTransaction();

		expect(await transactionRepository.getAll()).toHaveLength(2);
	});
});
