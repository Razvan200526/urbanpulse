import { beforeEach, describe, expect, test } from "bun:test";
import { resourceRepository } from "@server/repositories/ResourceRepository";
import { TransactionStatusEnum } from "@shared/types";
import {
	createResource,
	createTransaction,
	createUser,
} from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("ResourceRepository", () => {
	beforeEach(resetDatabase);

	test("supports CRUD operations", async () => {
		const owner = await createUser();
		expect(
			await resourceRepository.getOne("00000000-0000-0000-0000-000000000000"),
		).toBeNull();

		const created = await resourceRepository.create({
			userId: owner.id,
			name: "Generator",
			availability: "Available",
			imageUrls: [],
		});

		expect(created).not.toBeNull();
		expect((await resourceRepository.getOne(created!.id))?.name).toBe(
			"Generator",
		);

		const updated = await resourceRepository.update(created!.id, {
			name: "Solar Generator",
		});
		expect(updated.name).toBe("Solar Generator");
		await expect(
			resourceRepository.update("00000000-0000-0000-0000-000000000000", {
				name: "Nope",
			}),
		).rejects.toThrow(
			"ResourceRepository: Record with id 00000000-0000-0000-0000-000000000000 not found",
		);

		expect(await resourceRepository.delete(created!.id)).toBe(true);
		expect(await resourceRepository.delete(created!.id)).toBe(false);
	});

	test("returns resources with the latest three transactions and borrower summaries", async () => {
		const owner = await createUser({ name: "Owner" });
		const borrower = await createUser({
			name: "Borrower",
			image: "avatar.png",
		});
		const resource = await createResource({
			userId: owner.id,
			name: "Chainsaw",
		});

		await createTransaction({
			resourceId: resource.id,
			borrowerId: borrower.id,
			lenderId: owner.id,
			status: TransactionStatusEnum.Pending,
			startAt: new Date("2025-01-01T00:00:00.000Z"),
		});
		await createTransaction({
			resourceId: resource.id,
			borrowerId: borrower.id,
			lenderId: owner.id,
			status: TransactionStatusEnum.Active,
			startAt: new Date("2025-01-02T00:00:00.000Z"),
		});
		await createTransaction({
			resourceId: resource.id,
			borrowerId: borrower.id,
			lenderId: owner.id,
			status: TransactionStatusEnum.Completed,
			startAt: new Date("2025-01-03T00:00:00.000Z"),
		});
		await createTransaction({
			resourceId: resource.id,
			borrowerId: borrower.id,
			lenderId: owner.id,
			status: TransactionStatusEnum.Cancelled,
			startAt: new Date("2025-01-04T00:00:00.000Z"),
		});

		const resources = await resourceRepository.getAll();
		expect(resources).toHaveLength(1);
		expect(resources[0]?.transactions).toHaveLength(3);
		expect(
			resources[0]?.transactions.map((transaction) => transaction.status),
		).toEqual([
			TransactionStatusEnum.Cancelled,
			TransactionStatusEnum.Completed,
			TransactionStatusEnum.Active,
		]);
		expect(resources[0]?.transactions[0]?.borrower).toEqual({
			id: borrower.id,
			name: "Borrower",
			image: "avatar.png",
		});
	});
});
