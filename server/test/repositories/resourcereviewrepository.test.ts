import { beforeEach, describe, expect, test } from "bun:test";
import { resourceReviewRepository } from "@server/repositories/ResourceReviewRepository";
import { TransactionStatusEnum } from "@shared/types";
import {
	createResource,
	createResourceReview,
	createTransaction,
	createUser,
} from "../helpers/fixtures";
import { resetDatabase } from "../helpers/testDatabase";

describe("ResourceReviewRepository", () => {
	beforeEach(resetDatabase);

	test("creates one review per transaction", async () => {
		const owner = await createUser();
		const borrower = await createUser();
		const resource = await createResource({ userId: owner.id });
		const transaction = await createTransaction({
			resourceId: resource.id,
			borrowerId: borrower.id,
			lenderId: owner.id,
			status: TransactionStatusEnum.Completed,
			endAt: new Date("2025-01-02T00:00:00.000Z"),
		});

		const review = await resourceReviewRepository.create({
			transactionId: transaction.id,
			resourceId: resource.id,
			reviewerId: borrower.id,
			revieweeId: owner.id,
			rating: 5,
			comment: "Easy handoff",
		});

		expect(review).toEqual(
			expect.objectContaining({
				transactionId: transaction.id,
				resourceId: resource.id,
				reviewerId: borrower.id,
				revieweeId: owner.id,
				rating: 5,
				comment: "Easy handoff",
			}),
		);
		await expect(
			resourceReviewRepository.create({
				transactionId: transaction.id,
				resourceId: resource.id,
				reviewerId: borrower.id,
				revieweeId: owner.id,
				rating: 4,
			}),
		).rejects.toThrow();
	});

	test("summarizes reviews by resource", async () => {
		const owner = await createUser();
		const borrower = await createUser();
		const resource = await createResource({ userId: owner.id });
		const firstTransaction = await createTransaction({
			resourceId: resource.id,
			borrowerId: borrower.id,
			lenderId: owner.id,
			status: TransactionStatusEnum.Completed,
			endAt: new Date("2025-01-02T00:00:00.000Z"),
		});
		const secondTransaction = await createTransaction({
			resourceId: resource.id,
			borrowerId: borrower.id,
			lenderId: owner.id,
			status: TransactionStatusEnum.Completed,
			endAt: new Date("2025-01-03T00:00:00.000Z"),
		});
		await createResourceReview({
			transactionId: firstTransaction.id,
			resourceId: resource.id,
			reviewerId: borrower.id,
			revieweeId: owner.id,
			rating: 5,
		});
		await createResourceReview({
			transactionId: secondTransaction.id,
			resourceId: resource.id,
			reviewerId: borrower.id,
			revieweeId: owner.id,
			rating: 3,
		});

		await expect(
			resourceReviewRepository.getSummaryByResourceId(resource.id),
		).resolves.toEqual({
			averageRating: 4,
			count: 2,
		});
	});

	test("returns latest reviews for a reviewee first", async () => {
		const owner = await createUser();
		const borrower = await createUser();
		const resource = await createResource({ userId: owner.id });
		const firstTransaction = await createTransaction({
			resourceId: resource.id,
			borrowerId: borrower.id,
			lenderId: owner.id,
			status: TransactionStatusEnum.Completed,
			endAt: new Date("2025-01-02T00:00:00.000Z"),
		});
		const secondTransaction = await createTransaction({
			resourceId: resource.id,
			borrowerId: borrower.id,
			lenderId: owner.id,
			status: TransactionStatusEnum.Completed,
			endAt: new Date("2025-01-03T00:00:00.000Z"),
		});
		await createResourceReview({
			transactionId: firstTransaction.id,
			resourceId: resource.id,
			reviewerId: borrower.id,
			revieweeId: owner.id,
			rating: 2,
			createdAt: new Date("2025-01-02T00:00:00.000Z"),
		});
		await createResourceReview({
			transactionId: secondTransaction.id,
			resourceId: resource.id,
			reviewerId: borrower.id,
			revieweeId: owner.id,
			rating: 5,
			createdAt: new Date("2025-01-03T00:00:00.000Z"),
		});

		const reviews = await resourceReviewRepository.getLatestByRevieweeId(
			owner.id,
		);

		expect(reviews.map((review) => review.rating)).toEqual([5, 2]);
	});
});
