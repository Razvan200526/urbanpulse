import type {
	ResourceType,
	TransactionType,
	UserType,
} from "@server/db/schema";
import {
	type ResourceRepository,
	resourceRepository,
} from "@server/repositories/ResourceRepository";
import {
	userRepository,
	type UserRepository,
} from "@server/repositories/UserRepository";
import { handleError } from "@server/utils/handleError";
import { logger } from "@server/utils/Logger";
import { isCreateResourceReqValid } from "@shared/validators/resources/isResourceValid";
import {
	type TransactionRepository,
	transactionRepository,
} from "@server/repositories/TransactionRepository";
import { socketManager } from "@server/services/SocketManager";
import { TransactionStatusEnum } from "@shared/types";

export class ResourceService {
	private resourceRepo: ResourceRepository;
	private userRepo: UserRepository;
	private transactionRepo: TransactionRepository;

	constructor() {
		this.resourceRepo = resourceRepository;
		this.userRepo = userRepository;
		this.transactionRepo = transactionRepository;
	}

	async createResource(data: Partial<ResourceType>) {
		const result = isCreateResourceReqValid(data);

		if (result.error) {
			handleError(result.error);
		}
		if (!result.data) {
			return null;
		}
		const newResource = await this.resourceRepo.create(result.data);
		console.info(newResource);
		return newResource;
	}

	async getResourceById(id: string): Promise<ResourceType | null> {
		try {
			return await this.resourceRepo.getOne(id);
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	async getResourceAuthor(resourceId: string) {
		const resource = await this.getResourceById(resourceId);
		if (!resource) {
			logger.info(`Resource with id : ${resourceId} not found`);
			return null;
		}
		const authorId = resource.userId;
		const author = await this.userRepo.getOne(authorId);
		return author;
	}

	async getAllResource() {
		try {
			const res = await this.resourceRepo.getAll();
			return await Promise.all(
				res.map(
					async (item: ResourceType & { transactions: TransactionType[] }) => {
						const { transactions, ...resourceProps } = item;
						const recentUsersIds = transactions
							.map((t: TransactionType) => t.borrowerId)
							.filter((id): id is string => Boolean(id));

						const recentUsersRaw = await Promise.all(
							recentUsersIds.map((id: string) => this.userRepo.getOne(id)),
						);
						const recentUsers: UserType[] = recentUsersRaw.filter(
							(u): u is UserType => Boolean(u),
						);

						return {
							resource: resourceProps,
							recentUsers,
						};
					},
				),
			);
		} catch (error) {
			handleError(error);
			return null;
		}
	}
	async updateResource(id: string, data: Partial<ResourceType>) {
		try {
			return await this.resourceRepo.update(id, data);
		} catch (error) {
			handleError(error);
			return null;
		}
	}
	async deleteSkill(id: string): Promise<boolean> {
		try {
			await this.resourceRepo.delete(id);
			return true;
		} catch (error) {
			handleError(error);
			return false;
		}
	}

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
				return { success: false as const, error: "Failed to create transaction record" };
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
								transactionId: newTransaction?.id 
							,
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

	async getPendingRequests(userId: string) {
		try {
			const pendingTransactions = await this.transactionRepo.getPendingByLenderId(userId);
			
			const populated = await Promise.all(
				pendingTransactions.map(async (t) => {
					const resource = await this.resourceRepo.getOne(t.resourceId);
					const borrower = await this.userRepo.getOne(t.borrowerId || "");
					return {
						transaction: t,
						resource,
						borrower,
					};
				})
			);

			return { success: true as const, data: populated };
		} catch (error) {
			handleError(error);
			return { success: false as const, error: "Failed to fetch pending requests" };
		}
	}

	async respondToRequest(transactionId: string, accept: boolean) {
		try {
			const t = await this.transactionRepo.getOne(transactionId);
			if (!t) return { success: false as const, error: "Transaction not found" };

			const newStatus = accept ? TransactionStatusEnum.Active : TransactionStatusEnum.Cancelled;
			const updated = await this.transactionRepo.update(transactionId, { status: newStatus });

			return { success: true as const, data: updated };
		} catch (error) {
			handleError(error);
			return { success: false as const, error: "Failed to respond to request" };
		}
	}
}
export const resourceService = new ResourceService();
