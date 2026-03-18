import { QuietHoursEntity } from "@server/entities/QuietHoursEntity";
import type { PrimaryDatabase } from "@server/shared";
import { primaryDatabase } from "@server/shared/PrimaryDatabase";
import type { DeleteResult, Repository } from "typeorm";
import type { IRepository } from "./IRepository";

export class QuietHoursRepository implements IRepository<QuietHoursEntity> {
	private database: PrimaryDatabase;

	constructor() {
		this.database = primaryDatabase;
	}

	async open(): Promise<Repository<QuietHoursEntity>> {
		return await this.database.open(QuietHoursEntity);
	}

	async close(): Promise<void> {
		await this.database.close();
	}

	async getOne(id: string): Promise<QuietHoursEntity | null> {
		const repository = await this.open();
		return await repository.findOne({
			where: {
				id,
			},
		});
	}

	async getAll(): Promise<QuietHoursEntity[]> {
		const repository = await this.open();
		return await repository.find();
	}

	async create(data: Partial<QuietHoursEntity>): Promise<QuietHoursEntity> {
		const repository = await this.open();
		return await repository.save(data);
	}

	async update(
		id: string,
		data: Partial<QuietHoursEntity>,
	): Promise<QuietHoursEntity> {
		const repository = await this.open();
		const entity = await repository.findOne({
			where: {
				id,
			},
		});
		if (!entity) {
			throw new Error(`QuietHours with id ${id} not found`);
		}
		return await repository.save({ ...entity, ...data });
	}

	async delete(id: string): Promise<DeleteResult> {
		const repo = await this.open();
		return await repo.delete({ id });
	}
}

export const quietHoursRepository = new QuietHoursRepository();
