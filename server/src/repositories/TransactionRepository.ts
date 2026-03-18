import { TransactionEntity } from "@server/entities/TransactionEntity";
import type { PrimaryDatabase } from "@server/shared";
import { primaryDatabase } from "@server/shared/PrimaryDatabase";
import type { DeleteResult, Repository } from "typeorm";
import type { IRepository } from "./IRepository";

export class TransactionRepository implements IRepository<TransactionEntity> {
	private database: PrimaryDatabase;

	constructor() {
		this.database = primaryDatabase;
	}

	async open(): Promise<Repository<TransactionEntity>> {
		return await this.database.open(TransactionEntity);
	}

	async close(): Promise<void> {
		await this.database.close();
	}

	async getOne(id: string): Promise<TransactionEntity | null> {
		const repository = await this.open();
		return await repository.findOne({
			where: {
				id,
			},
		});
	}

	async getAll(): Promise<TransactionEntity[]> {
		const repository = await this.open();
		return await repository.find();
	}

	async create(data: Partial<TransactionEntity>): Promise<TransactionEntity> {
		const repository = await this.open();
		return await repository.save(data);
	}

	async update(id: string, data: Partial<TransactionEntity>): Promise<TransactionEntity> {
		const repository = await this.open();
		const entity = await repository.findOne({
			where: {
				id,
			},
		});
		if (!entity) {
			throw new Error(`Transaction with id ${id} not found`);
		}
		return await repository.save({ ...entity, ...data });
	}

	async delete(id: string): Promise<DeleteResult> {
		const repo = await this.open();
		return await repo.delete({ id });
	}
}

export const transactionRepository = new TransactionRepository();
