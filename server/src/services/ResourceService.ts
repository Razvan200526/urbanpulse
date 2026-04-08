import type {
	ResourceType,
	TransactionType,
	UserType,
} from "@server/db/schema";
import { cacheManager } from "@server/services/cache/CacheManager";
import {
	type ResourceRepository,
	resourceRepository,
} from "@server/repositories/ResourceRepository";
import {
	type TransactionRepository,
	transactionRepository,
} from "@server/repositories/TransactionRepository";
import {
	type UserRepository,
	userRepository,
} from "@server/repositories/UserRepository";
import { socketManager } from "@server/services/SocketManager";
import { handleError } from "@server/utils/handleError";
import { logger } from "@server/utils/Logger";
import { type FilterResourceType, TransactionStatusEnum } from "@shared/types";
import { isCreateResourceReqValid } from "@shared/validators/resources/isResourceValid";

export class ResourceService {
	private resourceRepo: ResourceRepository;
	private userRepo: UserRepository;
	private transactionRepo: TransactionRepository;
	private cache = cacheManager;

	constructor() {
		this.resourceRepo = resourceRepository;
		this.userRepo = userRepository;
		this.transactionRepo = transactionRepository;
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

					return {
						resource: resourceProps,
						author,
						recentUsers,
					};
				},
			),
		);
	}

	/**
	 * Creates a new resource in the database.
	 * @param data The resource data to create.
	 * @returns {Promise<ResourceType | null>} The created resource, or null if the creation failed.
	 */
	async createResource(
		data: Partial<ResourceType>,
	): Promise<ResourceType | null> {
		const result = isCreateResourceReqValid(data);

		if (!result.success) {
			handleError(result.error);
			return null;
		}
		try {
			return await this.resourceRepo.create(result.data);
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
			{ namespace: "resource", ttl: 600 }
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
	 * @param filter Takes in the availability filter
	 * @returns A list of resources filtered by the availability status.
	 */
	async getFilteredResources(filter: FilterResourceType) {
		try {
			if (filter === "All") {
				return await this.getAllResources();
			}

			const res = await this.resourceRepo.getByOptions({
				availability: filter,
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
			{ namespace: "resource", ttl: 600 }
		);
	}

	/**
	 * Updates a resource by its ID.
	 * @param id The ID of the resource to update.
	 * @param data The data to update.
	 * @returns
	 */
	async updateResource(id: string, data: Partial<ResourceType>) {
		try {
			return await this.resourceRepo.update(id, data);
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
	async deleteResource(id: string): Promise<boolean> {
		try {
			await this.resourceRepo.delete(id);
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

			const allConnections = socketManager.getAllConnections();
			const lenderConnection = allConnections.find(
				(conn) => conn.userId === resource.userId,
			);

			if (lenderConnection) {
				logger.info(
					`Notifying lender ${resource.userId} about new transaction request.`,
				);
				lenderConnection.ws.send(
					JSON.stringify({
						success: true,
						channelName: "notifications:transaction",
						data: {
							type: "TRANSACTION",
							payload: {
								transactionId: newTransaction?.id,
								resourceId: resource.id,
								resourceName: resource.name,
								borrowerId: requestData.borrowerId,
							},
						},
						message: `New borrow request for resource: ${resource.name}`,
					}),
				);
			}

			return { success: true as const, data: newTransaction };
		} catch (error) {
			handleError(error);
			return { success: false as const, error: "Failed to create transaction" };
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
	async respondToRequest(transactionId: string, accept: boolean) {
		try {
			const t = await this.transactionRepo.getOne(transactionId);
			if (!t)
				return { success: false as const, error: "Transaction not found" };

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
			}
			const updated = await this.transactionRepo.update(transactionId, {
				status: newStatus,
			});

			return { success: true as const, data: updated };
		} catch (error) {
			handleError(error);
			return { success: false as const, error: "Failed to respond to request" };
		}
	}
}
export const resourceService = new ResourceService();
