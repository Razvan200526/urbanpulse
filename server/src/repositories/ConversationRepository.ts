import { ConversationEntity } from "@server/entities/ConversationEntity";
import type { PrimaryDatabase } from "@server/shared";
import { primaryDatabase } from "@server/shared/PrimaryDatabase";
import type { DeleteResult, Repository } from "typeorm";
import type { IRepository } from "./IRepository";

export class ConversationRepository implements IRepository<ConversationEntity> {
	private database: PrimaryDatabase;

	constructor() {
		this.database = primaryDatabase;
	}

	async open(): Promise<Repository<ConversationEntity>> {
		return await this.database.open(ConversationEntity);
	}

	async close(): Promise<void> {
		await this.database.close();
	}

	async getOne(id: string): Promise<ConversationEntity | null> {
		const repository = await this.open();
		return await repository.findOne({
			where: {
				id,
			},
		});
	}

	async getAll(): Promise<ConversationEntity[]> {
		const repository = await this.open();
		return await repository.find();
	}

	async create(data: Partial<ConversationEntity>): Promise<ConversationEntity> {
		const repository = await this.open();
		return await repository.save(data);
	}

	async update(id: string, data: Partial<ConversationEntity>): Promise<ConversationEntity> {
		const repository = await this.open();
		const entity = await repository.findOne({
			where: {
				id,
			},
		});
		if (!entity) {
			throw new Error(`Conversation with id ${id} not found`);
		}
		return await repository.save({ ...entity, ...data });
	}

	async delete(id: string): Promise<DeleteResult> {
		const repo = await this.open();
		return await repo.delete({ id });
	}
}

export const conversationRepository = new ConversationRepository();
