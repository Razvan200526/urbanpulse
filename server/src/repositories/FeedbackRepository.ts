import { FeedbackEntity } from "@server/entities/FeedBackEntity";
import type { PrimaryDatabase } from "@server/shared";
import { primaryDatabase } from "@server/shared/PrimaryDatabase";
import type { DeleteResult, Repository } from "typeorm";
import type { IRepository } from "./IRepository";

export class FeedbackRepository implements IRepository<FeedbackEntity> {
	private database: PrimaryDatabase;

	constructor() {
		this.database = primaryDatabase;
	}

	async open(): Promise<Repository<FeedbackEntity>> {
		return await this.database.open(FeedbackEntity);
	}

	async close(): Promise<void> {
		await this.database.close();
	}

	async getOne(id: string): Promise<FeedbackEntity | null> {
		const repository = await this.open();
		return await repository.findOne({
			where: {
				id,
			},
		});
	}

	async getAll(): Promise<FeedbackEntity[]> {
		const repository = await this.open();
		return await repository.find();
	}

	async create(data: Partial<FeedbackEntity>): Promise<FeedbackEntity> {
		const repository = await this.open();
		return await repository.save(data);
	}

	async update(
		id: string,
		data: Partial<FeedbackEntity>,
	): Promise<FeedbackEntity> {
		const repository = await this.open();
		const entity = await repository.findOne({
			where: {
				id,
			},
		});
		if (!entity) {
			throw new Error(`Feedback with id ${id} not found`);
		}
		return await repository.save({ ...entity, ...data });
	}

	async delete(id: string): Promise<DeleteResult> {
		const repo = await this.open();
		return await repo.delete({ id });
	}
}

export const feedbackRepository = new FeedbackRepository();
