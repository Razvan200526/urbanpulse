import { ConversationMemberEntity } from "@server/entities/ConversationMemberEntity";
import type { PrimaryDatabase } from "@server/shared";
import { primaryDatabase } from "@server/shared/PrimaryDatabase";
import type { DeleteResult, Repository } from "typeorm";
import type { IRepository } from "./IRepository";

export class ConversationMemberRepository implements IRepository<ConversationMemberEntity> {
	private database: PrimaryDatabase;

	constructor() {
		this.database = primaryDatabase;
	}

	async open(): Promise<Repository<ConversationMemberEntity>> {
		return await this.database.open(ConversationMemberEntity);
	}

	async close(): Promise<void> {
		await this.database.close();
	}

	async getOne(id: string): Promise<ConversationMemberEntity | null> {
		const repository = await this.open();
		return await repository.findOne({
			where: {
				id,
			},
		});
	}

	async getAll(): Promise<ConversationMemberEntity[]> {
		const repository = await this.open();
		return await repository.find();
	}

	async create(data: Partial<ConversationMemberEntity>): Promise<ConversationMemberEntity> {
		const repository = await this.open();
		return await repository.save(data);
	}

	async update(id: string, data: Partial<ConversationMemberEntity>): Promise<ConversationMemberEntity> {
		const repository = await this.open();
		const entity = await repository.findOne({
			where: {
				id,
			},
		});
		if (!entity) {
			throw new Error(`ConversationMember with id ${id} not found`);
		}
		return await repository.save({ ...entity, ...data });
	}

	async delete(id: string): Promise<DeleteResult> {
		const repo = await this.open();
		return await repo.delete({ id });
	}
}

export const conversationMemberRepository = new ConversationMemberRepository();
