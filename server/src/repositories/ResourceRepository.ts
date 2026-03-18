import { ResourceEntity } from "@server/entities/ResourceEntity";
import type { PrimaryDatabase } from "@server/shared";
import { primaryDatabase } from "@server/shared/PrimaryDatabase";
import type { DeleteResult, Repository } from "typeorm";
import type { IRepository } from "./IRepository";

export class ResourceRepository implements IRepository<ResourceEntity> {
	private database: PrimaryDatabase;

	constructor() {
		this.database = primaryDatabase;
	}

	async open(): Promise<Repository<ResourceEntity>> {
		return await this.database.open(ResourceEntity);
	}

	async close(): Promise<void> {
		await this.database.close();
	}

	async getOne(id: string): Promise<ResourceEntity | null> {
		const repository = await this.open();
		return await repository.findOne({
			where: {
				id,
			},
		});
	}

	async getAll(): Promise<ResourceEntity[]> {
		const repository = await this.open();
		return await repository.find();
	}

	async create(data: Partial<ResourceEntity>): Promise<ResourceEntity> {
		const repository = await this.open();
		return await repository.save(data);
	}

	async update(
		id: string,
		data: Partial<ResourceEntity>,
	): Promise<ResourceEntity> {
		const repository = await this.open();
		const entity = await repository.findOne({
			where: {
				id,
			},
		});
		if (!entity) {
			throw new Error(`Resource with id ${id} not found`);
		}
		return await repository.save({ ...entity, ...data });
	}

	async delete(id: string): Promise<DeleteResult> {
		const repo = await this.open();
		return await repo.delete({ id });
	}
}

export const resourceRepository = new ResourceRepository();
