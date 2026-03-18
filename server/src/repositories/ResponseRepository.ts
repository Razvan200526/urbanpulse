import { ResponseEntity } from "@server/entities/PulseResponseEntity";
import type { PrimaryDatabase } from "@server/shared";
import { primaryDatabase } from "@server/shared/PrimaryDatabase";
import type { DeleteResult, Repository } from "typeorm";
import type { IRepository } from "./IRepository";

export class ResponseRepository implements IRepository<ResponseEntity> {
	private database: PrimaryDatabase;

	constructor() {
		this.database = primaryDatabase;
	}

	async open(): Promise<Repository<ResponseEntity>> {
		return await this.database.open(ResponseEntity);
	}

	async close(): Promise<void> {
		await this.database.close();
	}

	async getOne(id: string): Promise<ResponseEntity | null> {
		const repository = await this.open();
		return await repository.findOne({
			where: {
				id,
			},
		});
	}

	async getAll(): Promise<ResponseEntity[]> {
		const repository = await this.open();
		return await repository.find();
	}

	async create(data: Partial<ResponseEntity>): Promise<ResponseEntity> {
		const repository = await this.open();
		return await repository.save(data);
	}

	async update(
		id: string,
		data: Partial<ResponseEntity>,
	): Promise<ResponseEntity> {
		const repository = await this.open();
		const entity = await repository.findOne({
			where: {
				id,
			},
		});
		if (!entity) {
			throw new Error(`Response with id ${id} not found`);
		}
		return await repository.save({ ...entity, ...data });
	}

	async delete(id: string): Promise<DeleteResult> {
		const repo = await this.open();
		return await repo.delete({ id });
	}
}

export const responseRepository = new ResponseRepository();
