import { NotificationEntity } from "@server/entities/NotificationEntity";
import type { PrimaryDatabase } from "@server/shared";
import { primaryDatabase } from "@server/shared/PrimaryDatabase";
import type { DeleteResult, Repository } from "typeorm";
import type { IRepository } from "./IRepository";

export class NotificationRepository implements IRepository<NotificationEntity> {
	private database: PrimaryDatabase;

	constructor() {
		this.database = primaryDatabase;
	}

	async open(): Promise<Repository<NotificationEntity>> {
		return await this.database.open(NotificationEntity);
	}

	async close(): Promise<void> {
		await this.database.close();
	}

	async getOne(id: string): Promise<NotificationEntity | null> {
		const repository = await this.open();
		return await repository.findOne({
			where: {
				id,
			},
		});
	}

	async getAll(): Promise<NotificationEntity[]> {
		const repository = await this.open();
		return await repository.find();
	}

	async create(data: Partial<NotificationEntity>): Promise<NotificationEntity> {
		const repository = await this.open();
		return await repository.save(data);
	}

	async update(id: string, data: Partial<NotificationEntity>): Promise<NotificationEntity> {
		const repository = await this.open();
		const entity = await repository.findOne({
			where: {
				id,
			},
		});
		if (!entity) {
			throw new Error(`Notification with id ${id} not found`);
		}
		return await repository.save({ ...entity, ...data });
	}

	async delete(id: string): Promise<DeleteResult> {
		const repo = await this.open();
		return await repo.delete({ id });
	}
}

export const notificationRepository = new NotificationRepository();
