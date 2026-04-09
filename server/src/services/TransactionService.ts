import type { TransactionType } from "@server/db/schema";
import {
	type TransactionRepository,
	transactionRepository,
} from "@server/repositories/TransactionRepository";
import { handleError } from "@server/utils/handleError";
import { isTransactionRequestValid } from "@shared/validators/isTransactionValid";

export class TransactionService {
	private transactionRepo: TransactionRepository;

	constructor() {
		this.transactionRepo = transactionRepository;
	}

	async createTransaction(data: Partial<TransactionType>) {
		const result = isTransactionRequestValid(data);

		try {
			if (result.error) {
				handleError(result.error);
				return null;
			}
			if (!result.success) return null;
		} catch (error) {
			handleError(error);
		}

		if (result.data == null) return null;
		this.transactionRepo.create(result.data as Partial<TransactionType>);
	}
	async getTransactionById(id: string): Promise<TransactionType | null> {
		try {
			return await this.transactionRepo.getOne(id);
		} catch (error) {
			handleError(error);
			return null;
		}
	}
	async getAllTransaction() {
		try {
			return await this.transactionRepo.getAll();
		} catch (error) {
			handleError(error);
			return null;
		}
	}
	async updateTransaction(id: string, data: Partial<TransactionType>) {
		try {
			return await this.transactionRepo.update(id, data);
		} catch (error) {
			handleError(error);
			return null;
		}
	}
	async deleteTransaction(id: string): Promise<boolean> {
		try {
			return await this.transactionRepo.delete(id);
		} catch (error) {
			handleError(error);
			return false;
		}
	}
}

export const transactionService = new TransactionService();
