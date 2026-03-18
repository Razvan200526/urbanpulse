import { PulseEntity } from "@server/entities/PulseEntity";
import type { PrimaryDatabase } from "@server/shared";
import { primaryDatabase } from "@server/shared/PrimaryDatabase";
import type { DeleteResult, Repository } from "typeorm";
import type { IRepository } from "./IRepository";

export class PulseRepository implements IRepository<PulseEntity> {
	private database: PrimaryDatabase;

	constructor() {
		this.database = primaryDatabase;
	}

	async open(): Promise<Repository<PulseEntity>> {
		return await this.database.open(PulseEntity);
	}

	async close(): Promise<void> {
		await this.database.close();
	}

	async getOne(id: string): Promise<PulseEntity | null> {
		const repository = await this.open();
		return await repository.findOne({
			where: {
				id,
			},
		});
	}

	async getAll(): Promise<PulseEntity[]> {
		const repository = await this.open();
		return await repository.find();
	}

	async create(data: Partial<PulseEntity>): Promise<PulseEntity> {
		const repository = await this.open();
		return await repository.save(data);
	}

	async update(id: string, data: Partial<PulseEntity>): Promise<PulseEntity> {
		const repository = await this.open();
		const entity = await repository.findOne({
			where: {
				id,
			},
		});
		if (!entity) {
			throw new Error(`Pulse with id ${id} not found`);
		}
		return await repository.save({ ...entity, ...data });
	}

	async delete(id: string): Promise<DeleteResult> {
		const repo = await this.open();
		return await repo.delete({ id });
	}
}

export const pulseRepository = new PulseRepository();
