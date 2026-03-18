import { PulseConfirmationEntity } from "@server/entities/PulseConfirmationEntity";
import type { PrimaryDatabase } from "@server/shared";
import { primaryDatabase } from "@server/shared/PrimaryDatabase";
import type { DeleteResult, Repository } from "typeorm";
import type { IRepository } from "./IRepository";

export class PulseConfirmationRepository
	implements IRepository<PulseConfirmationEntity>
{
	private database: PrimaryDatabase;

	constructor() {
		this.database = primaryDatabase;
	}

	async open(): Promise<Repository<PulseConfirmationEntity>> {
		return await this.database.open(PulseConfirmationEntity);
	}

	async close(): Promise<void> {
		await this.database.close();
	}

	async getOne(id: string): Promise<PulseConfirmationEntity | null> {
		const repository = await this.open();
		return await repository.findOne({
			where: {
				id,
			},
		});
	}

	async getAll(): Promise<PulseConfirmationEntity[]> {
		const repository = await this.open();
		return await repository.find();
	}

	async create(
		data: Partial<PulseConfirmationEntity>,
	): Promise<PulseConfirmationEntity> {
		const repository = await this.open();
		return await repository.save(data);
	}

	async update(
		id: string,
		data: Partial<PulseConfirmationEntity>,
	): Promise<PulseConfirmationEntity> {
		const repository = await this.open();
		const entity = await repository.findOne({
			where: {
				id,
			},
		});
		if (!entity) {
			throw new Error(`PulseConfirmation with id ${id} not found`);
		}
		return await repository.save({ ...entity, ...data });
	}

	async delete(id: string): Promise<DeleteResult> {
		const repo = await this.open();
		return await repo.delete({ id });
	}
}

export const pulseConfirmationRepository = new PulseConfirmationRepository();
