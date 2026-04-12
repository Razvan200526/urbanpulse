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
			position: { x: 26.1025, y: 44.4268 } as any,
			resourceType: "Item",
			locationLabel: "Bucharest",
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

		const resources = await resourceRepository.getFilteredResources({
			filter: "All",
			excludeOwn: false,
			radiusMeters: 2000,
		});
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

	test("filters resources by availability, type, and radius", async () => {
		const owner = await createUser();
		const nearbyItem = await createResource({
			userId: owner.id,
			name: "Nearby generator",
			availability: "Available",
			resourceType: "Item",
			position: { x: 26.1025, y: 44.4268 } as any,
		});
		await createResource({
			userId: owner.id,
			name: "Nearby first aid",
			availability: "Available",
			resourceType: "Skill",
			position: { x: 26.1026, y: 44.4268 } as any,
		});
		await createResource({
			userId: owner.id,
			name: "Far generator",
			availability: "Unavailable",
			resourceType: "Item",
			position: { x: 27.1025, y: 45.4268 } as any,
		});

		const resources = await resourceRepository.getFilteredResources({
			filter: "Available",
			excludeOwn: false,
			type: "Item",
			lat: 44.4268,
			long: 26.1025,
			radiusMeters: 500,
		});

		expect(resources.map((item) => item.id)).toEqual([nearbyItem.id]);
	});

	test("orders distance-filtered resources from nearest to farthest", async () => {
		const owner = await createUser();
		const far = await createResource({
			userId: owner.id,
			name: "Far resource",
			position: { x: 26.1425, y: 44.4268 } as any,
			resourceType: "Item",
		});
		const near = await createResource({
			userId: owner.id,
			name: "Near resource",
			position: { x: 26.1026, y: 44.4268 } as any,
			resourceType: "Item",
		});

		const resources = await resourceRepository.getFilteredResources({
			filter: "All",
			excludeOwn: false,
			lat: 44.4268,
			long: 26.1025,
			radiusMeters: 5000,
		});

		expect(resources.map((item) => item.id)).toEqual([near.id, far.id]);
	});

	test("excludes the viewer's own resources when requested", async () => {
		const owner = await createUser();
		const otherUser = await createUser();
		await createResource({
			userId: owner.id,
			name: "My generator",
			resourceType: "Item",
		});
		const otherResource = await createResource({
			userId: otherUser.id,
			name: "Neighbor generator",
			resourceType: "Item",
		});

		const resources = await resourceRepository.getFilteredResources(
			{
				filter: "All",
				excludeOwn: false,
				radiusMeters: 2000,
			},
			{ excludeUserId: owner.id },
		);

		expect(resources.map((item) => item.id)).toEqual([otherResource.id]);
	});
});
