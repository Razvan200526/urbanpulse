import type {
	ResourceType,
	TransactionType,
	UserType,
} from "@server/db/schema";
import {
	type ResourceRepository,
	resourceRepository,
} from "@server/repositories/ResourceRepository";
import { resourceReviewRepository } from "@server/repositories/ResourceReviewRepository";
import {
	type TransactionRepository,
	transactionRepository,
} from "@server/repositories/TransactionRepository";
import {
	type UserRepository,
	userRepository,
} from "@server/repositories/UserRepository";
import { cacheManager } from "@server/services/cache/CacheManager";
import { notificationService } from "@server/services/NotificationService";
import { handleError } from "@server/utils/handleError";
import { logger } from "@server/utils/Logger";
import { type FilterResourceType, TransactionStatusEnum } from "@shared/types";
import type { GetResourceQuery } from "@shared/validators/resources/isGetResourcesQueryValid";
import {
	type CreateResourcePayload,
	isCreateResourceReqValid,
	isUpdateResourceReqValid,
	type UpdateResourcePayload,
} from "@shared/validators/resources/isResourceValid";
import {
	isResourceReviewReqValid,
	type ResourceReviewPayload,
} from "@shared/validators/transactions/isTransactionRequestValid";
import { locationService } from "./LocationService";

const VERIFIED_NEIGHBOR_RESOURCE_TYPES = new Set<ResourceType["resourceType"]>([
	"Item",
]);
const POSITIVE_REVIEW_THRESHOLD = 4;
const NEGATIVE_REVIEW_THRESHOLD = 2;
const VERIFIED_NEIGHBOR_INTERACTION_THRESHOLD = 3;

export class ResourceService {
	private resourceRepo: ResourceRepository;
	private userRepo: UserRepository;
	private transactionRepo: TransactionRepository;
	private cache = cacheManager;
	private reviewRepo = resourceReviewRepository;

	constructor() {
		this.resourceRepo = resourceRepository;
		this.userRepo = userRepository;
		this.transactionRepo = transactionRepository;
	}

	private async invalidateResourceCaches(resourceId?: string, userId?: string) {
		await Promise.all([
			resourceId
				? this.cache.invalidate(resourceId, { namespace: "resource" })
				: Promise.resolve(),
			userId
				? this.cache.invalidatePattern(`${userId}:*`, "resource")
				: Promise.resolve(),
		]);
	}

	private async invalidateProfileCache(userId?: string | null) {
		if (!userId) {
			return;
		}

		await this.cache.invalidate(`${userId}:profile`, {
			namespace: "profile",
		});
	}

	private async mapResourcesWithUsers(
		resources: Array<ResourceType & { transactions: TransactionType[] }>,
	) {
		return await Promise.all(
			resources.map(
				async (item: ResourceType & { transactions: TransactionType[] }) => {
					const { transactions, ...resourceProps } = item;
					const recentUsers = transactions
						.map(
							(t: TransactionType & { borrower?: UserType | null }) =>
								t.borrower,
						)
						.filter((u): u is UserType => Boolean(u));
					const author = await this.userRepo.getOne(resourceProps.userId);
					const reviewSummary = await this.reviewRepo.getSummaryByResourceId(
						resourceProps.id,
					);

					return {
						resource: resourceProps,
						author,
						recentUsers,
						reviewSummary,
					};
				},
			),
		);
	}

	private getReviewDirection(rating: number) {
		if (rating >= POSITIVE_REVIEW_THRESHOLD) return "positive";
		if (rating <= NEGATIVE_REVIEW_THRESHOLD) return "negative";
		return "neutral";
	}

	private clampTrustScore(score: number) {
		return Math.max(0, Math.min(100, score));
	}

	private requiresVerifiedNeighbor(resource: ResourceType) {
		return VERIFIED_NEIGHBOR_RESOURCE_TYPES.has(resource.resourceType);
	}

	private async buildReviewImpactPatch(revieweeId: string, rating: number) {
		const reviewee = await this.userRepo.getOne(revieweeId);
		if (!reviewee) {
			return null;
		}

		const direction = this.getReviewDirection(rating);
		const patch: Partial<UserType> = {};

		if (direction === "positive") {
			const successfulInteractions = (reviewee.successfulInteractions ?? 0) + 1;
			patch.successfulInteractions = successfulInteractions;

			if (
				!reviewee.isVerified &&
				successfulInteractions >= VERIFIED_NEIGHBOR_INTERACTION_THRESHOLD
			) {
				patch.isVerified = true;
			}
		}

		if (direction === "neutral") {
			return Object.keys(patch).length > 0 ? patch : null;
		}

		const latestReviews =
			await this.reviewRepo.getLatestByRevieweeId(revieweeId);
		let streakCount = 0;

		for (const review of latestReviews) {
			if (this.getReviewDirection(review.rating) !== direction) {
				break;
			}
			streakCount += 1;
		}

		if (streakCount === 0 || streakCount % 3 !== 0) {
			return Object.keys(patch).length > 0 ? patch : null;
		}

		const currentScore = reviewee.trustScore ?? 0;
		patch.trustScore = this.clampTrustScore(
			currentScore + (direction === "positive" ? 5 : -5),
		);

		return patch;
	}

	/**
	 * Creates a new resource in the database.
	 * @param data The resource data to create.
	 * @returns {Promise<ResourceType | null>} The created resource, or null if the creation failed.
	 */
	async createResource(
		userId: string,
		data: CreateResourcePayload,
	): Promise<ResourceType | null> {
		const result = isCreateResourceReqValid(data);

		if (!result.success) {
			handleError(result.error);
			return null;
		}
		const resourceData = {
			...result.data,
			userId,
		};
		if (!result.data.locationLabel) {
			try {
				const locationLabel = await locationService.getAddressByCoords(
					resourceData.position,
				);
				if (locationLabel) {
					resourceData.locationLabel = locationLabel;
				}
			} catch (error) {
				handleError(error);
			}
		}
		try {
			const createdResource = await this.resourceRepo.create(resourceData);
			if (createdResource) {
				await this.invalidateResourceCaches(createdResource.id, userId);
			}

			return createdResource;
		} catch (e) {
			handleError(e);
			return null;
		}
	}

	/**
	 * Retrieves a resource by its ID.
	 * @param id The ID of the resource to retrieve.
	 * @returns {Promise<ResourceType | null>} The resource, or null if not found.
	 */
	async getResourceById(id: string): Promise<ResourceType | null> {
		return await this.cache.getOrSet(
			id,
			async () => {
				try {
					return await this.resourceRepo.getOne(id);
				} catch (error) {
					handleError(error);
					return null;
				}
			},
			{ namespace: "resource", ttl: 600 },
		);
	}

	/**
	 * Retrieves the author of a resource.
	 * @param resourceId The ID of the resource.
	 * @returns {Promise<UserType | null>} The author, or null if not found.
	 */
	async getResourceAuthor(resourceId: string): Promise<UserType | null> {
		try {
			const resource = await this.getResourceById(resourceId);
			if (!resource) {
				logger.info(`Resource with id : ${resourceId} not found`);
				return null;
			}
			const authorId = resource.userId;
			const author = await this.userRepo.getOne(authorId);
			return author;
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	/**
	 * Retrieves all resources.
	 * @returns An array of resources and recent users.
	 */
	async getAllResources() {
		try {
			const res = await this.resourceRepo.getAll();
			return await this.mapResourcesWithUsers(res);
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	/**
	 *
	 * @param query Takes in the query with filters
	 * @returns A list of resources filtered by the availability status.
	 */
	async getFilteredResources(
		query: GetResourceQuery,
		viewerUserId: string | null = null,
	) {
		try {
			const res = await this.resourceRepo.getFilteredResources(query, {
				excludeUserId: query.excludeOwn ? viewerUserId ?? undefined : undefined,
			});
			return await this.mapResourcesWithUsers(res);
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	async getResourcesByUserId(userId: string, filter: FilterResourceType) {
		const cacheKey = `${userId}:${filter}`;
		return await this.cache.getOrSet(
			cacheKey,
			async () => {
				try {
					const options =
						filter === "All"
							? { userId }
							: {
									userId,
									availability: filter,
								};

					const res = await this.resourceRepo.getByOptions(options);
					return await this.mapResourcesWithUsers(res);
				} catch (error) {
					handleError(error);
					return null;
				}
			},
			{ namespace: "resource", ttl: 600 },
		);
	}

	/**
	 * Updates a resource by its ID.
	 * @param id The ID of the resource to update.
	 * @param data The data to update.
	 * @returns
	 */
	async updateResource(
		resourceId: string,
		userId: string,
		data: UpdateResourcePayload,
	) {
		try {
			const resource = await this.resourceRepo.getOne(resourceId);
			if (!resource || resource.userId !== userId) {
				logger.error("Unauthorized");
				return null;
			}

			const result = isUpdateResourceReqValid(data);
			if (!result.success) {
				handleError(result.error);
				return null;
			}

			const updatedResource = await this.resourceRepo.update(
				resourceId,
				result.data,
			);
			await this.invalidateResourceCaches(resourceId, userId);
			return updatedResource;
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	/**
	 * Deletes a resource by its ID.
	 * @param id The ID of the resource to delete.
	 * @returns True if the deletion was successful, false otherwise.
	 */
	async deleteResource(resourceId: string, userId: string): Promise<boolean> {
		const resource = await this.resourceRepo.getOne(resourceId);
		if (resource?.userId !== userId) {
			logger.error("Unauthorized");
			return false;
		}
		try {
			await this.resourceRepo.delete(resourceId);
			await this.invalidateResourceCaches(resourceId, userId);
			return true;
		} catch (error) {
			handleError(error);
			return false;
		}
	}

	/**
	 * Requests a borrow for a resource.
	 * @param requestData The request data, including the resource ID and borrower ID.
	 * @returns The result of the request, including a success flag and an error message if applicable.
	 */
	async requestBorrow(requestData: { resourceId: string; borrowerId: string }) {
		try {
			const resource = await this.resourceRepo.getOne(requestData.resourceId);
			if (!resource) {
				return { success: false as const, error: "Resource not found" };
			}
			if (resource.userId === requestData.borrowerId) {
				return {
					success: false as const,
					error: "You cannot borrow your own resource",
				};
			}
			if (resource.availability !== "Available") {
				return {
					success: false as const,
					error: "Resource is not currently available",
				};
			}
			const borrower = await this.userRepo.getOne(requestData.borrowerId);
			if (!borrower) {
				return {
					success: false as const,
					error: "Borrower account not found",
				};
			}
			if (
				this.requiresVerifiedNeighbor(resource) &&
				borrower.isVerified !== true
			) {
				return {
					success: false as const,
					error:
						"Verified Neighbor status is required to borrow community item listings. Complete three positively reviewed help interactions to unlock it.",
				};
			}

			const existingTransactions =
				await this.transactionRepo.getByResourceAndBorrowerId(
					requestData.resourceId,
					requestData.borrowerId,
				);
			const hasOpenTransaction = existingTransactions.some((transaction) =>
				[TransactionStatusEnum.Pending, TransactionStatusEnum.Active].includes(
					transaction.status,
				),
			);
			if (hasOpenTransaction) {
				return {
					success: false as const,
					error: "You already have an open request for this resource",
				};
			}

			const newTransaction = await this.transactionRepo.create({
				status: TransactionStatusEnum.Pending,
				borrowerId: requestData.borrowerId,
				lenderId: resource.userId,
				resourceId: requestData.resourceId,
				startAt: new Date(),
			});

			if (!newTransaction) {
				return {
					success: false as const,
					error: "Failed to create transaction record",
				};
			}

			await notificationService.notifyResourceTransaction({
				recipientUserId: resource.userId,
				action: "REQUESTED",
				transactionId: newTransaction.id,
				resourceId: resource.id,
				resourceName: resource.name,
				borrowerId: requestData.borrowerId,
				borrowerName: borrower?.name ?? null,
				lenderId: resource.userId,
				status: newTransaction.status,
			});
			await this.invalidateResourceCaches(resource.id, resource.userId);

			return { success: true as const, data: newTransaction };
		} catch (error) {
			handleError(error);
			return { success: false as const, error: "Failed to create transaction" };
		}
	}

	async getResourceTransactionForBorrower(
		resourceId: string,
		borrowerId: string,
	) {
		try {
			const transactions =
				await this.transactionRepo.getByResourceAndBorrowerId(
					resourceId,
					borrowerId,
				);

			for (const t of transactions) {
				if (
					t.status === TransactionStatusEnum.Pending ||
					t.status === TransactionStatusEnum.Active
				) {
					return { success: true as const, data: t };
				}

				if (t.status === TransactionStatusEnum.Completed) {
					const existingReview = await this.reviewRepo.getByTransactionId(t.id);
					if (!existingReview) {
						return { success: true as const, data: t };
					}
				}
			}

			return { success: true as const, data: null };
		} catch (error) {
			handleError(error);
			return {
				success: false as const,
				error: "Failed to fetch resource transaction",
			};
		}
	}

	/**
	 * Retrieves pending requests for a lender.
	 * @param userId The ID of the lender.
	 * @returns The pending transactions, including the resource and borrower details.
	 */
	async getPendingRequests(userId: string) {
		try {
			const pendingTransactions =
				await this.transactionRepo.getPendingByLenderId(userId);

			const populated = await Promise.all(
				pendingTransactions.map(async (t) => {
					const resource = await this.resourceRepo.getOne(t.resourceId);
					const borrower = await this.userRepo.getOne(t.borrowerId || "");
					return {
						transaction: t,
						resource,
						borrower,
					};
				}),
			);

			return { success: true as const, data: populated };
		} catch (error) {
			handleError(error);
			return {
				success: false as const,
				error: "Failed to fetch pending requests",
			};
		}
	}

	/**
	 * Responds to a request by updating the transaction status and resource availability.
	 * @param transactionId The ID of the transaction to respond to.
	 * @param accept Whether the request is accepted or rejected.
	 * @returns The result of the response, including a success flag and an error message if applicable.
	 */
	async respondToRequest(
		transactionId: string,
		accept: boolean,
		actorUserId: string,
	) {
		try {
			const t = await this.transactionRepo.getOne(transactionId);
			if (!t)
				return { success: false as const, error: "Transaction not found" };
			if (!t.lenderId || t.lenderId !== actorUserId) {
				return {
					success: false as const,
					error: "Only the resource owner can respond to this request",
				};
			}
			if (t.status !== TransactionStatusEnum.Pending) {
				return {
					success: false as const,
					error: "Only pending requests can be updated",
				};
			}

			const newStatus = accept
				? TransactionStatusEnum.Active
				: TransactionStatusEnum.Cancelled;
			const resource = await this.resourceRepo.getOne(t.resourceId);
			if (!resource)
				return { success: false as const, error: "Resource not found" };

			if (accept) {
				await this.resourceRepo.update(resource.id, {
					availability: "Currently Unavailable",
				});
				await this.transactionRepo.cancelPendingByResourceId(
					resource.id,
					transactionId,
				);
			}
			const updated = await this.transactionRepo.update(transactionId, {
				status: newStatus,
			});

			if (updated.borrowerId) {
				const borrower = await this.userRepo.getOne(updated.borrowerId);
				await notificationService.notifyResourceTransaction({
					recipientUserId: updated.borrowerId,
					action: accept ? "ACCEPTED" : "REJECTED",
					transactionId: updated.id,
					resourceId: resource.id,
					resourceName: resource.name,
					borrowerId: updated.borrowerId,
					borrowerName: borrower?.name ?? null,
					lenderId: updated.lenderId,
					status: updated.status,
				});
			}
			await this.invalidateResourceCaches(resource.id, resource.userId);

			return { success: true as const, data: updated };
		} catch (error) {
			handleError(error);
			return { success: false as const, error: "Failed to respond to request" };
		}
	}

	async completeResourceTransaction(transactionId: string, borrowerId: string) {
		try {
			const t = await this.transactionRepo.getOne(transactionId);
			if (!t)
				return { success: false as const, error: "Transaction not found" };
			if (!t.borrowerId || t.borrowerId !== borrowerId) {
				return {
					success: false as const,
					error: "Only the borrower can complete this transaction",
				};
			}
			if (t.status !== TransactionStatusEnum.Active) {
				return {
					success: false as const,
					error: "Only active transactions can be completed",
				};
			}

			const resource = await this.resourceRepo.getOne(t.resourceId);
			if (!resource)
				return { success: false as const, error: "Resource not found" };

			const updated = await this.transactionRepo.update(transactionId, {
				status: TransactionStatusEnum.Completed,
				endAt: new Date(),
			});
			await this.resourceRepo.update(resource.id, {
				availability: "Available",
			});
			await this.invalidateResourceCaches(resource.id, resource.userId);

			return { success: true as const, data: updated };
		} catch (error) {
			handleError(error);
			return {
				success: false as const,
				error: "Failed to complete transaction",
			};
		}
	}

	async submitResourceReview(
		transactionId: string,
		reviewerId: string,
		data: ResourceReviewPayload,
	) {
		const result = isResourceReviewReqValid(data);
		if (!result.success) {
			handleError(result.error);
			return { success: false as const, error: "Invalid review data" };
		}

		try {
			const t = await this.transactionRepo.getOne(transactionId);
			if (!t)
				return { success: false as const, error: "Transaction not found" };
			if (!t.borrowerId || t.borrowerId !== reviewerId) {
				return {
					success: false as const,
					error: "Only the borrower can review this transaction",
				};
			}
			if (t.status !== TransactionStatusEnum.Completed) {
				return {
					success: false as const,
					error: "Only completed transactions can be reviewed",
				};
			}

			const existingReview =
				await this.reviewRepo.getByTransactionId(transactionId);
			if (existingReview) {
				return {
					success: false as const,
					error: "This transaction has already been reviewed",
				};
			}

			const resource = await this.resourceRepo.getOne(t.resourceId);
			if (!resource)
				return { success: false as const, error: "Resource not found" };

			const created = await this.reviewRepo.create({
				transactionId,
				resourceId: resource.id,
				reviewerId,
				revieweeId: resource.userId,
				rating: result.data.rating,
				comment: result.data.comment ?? null,
			});

			if (!created) {
				return { success: false as const, error: "Failed to create review" };
			}

			const reviewImpact = await this.buildReviewImpactPatch(
				resource.userId,
				result.data.rating,
			);
			if (reviewImpact) {
				await this.userRepo.update(resource.userId, reviewImpact);
			}
			await Promise.all([
				this.invalidateResourceCaches(resource.id, resource.userId),
				this.invalidateProfileCache(resource.userId),
			]);

			return { success: true as const, data: created };
		} catch (error) {
			handleError(error);
			return { success: false as const, error: "Failed to submit review" };
		}
	}
}
export const resourceService = new ResourceService();
