import { UserEntity } from "@server/entities/UserEntity";
import type { PrimaryDatabase } from "@server/shared";
import { primaryDatabase } from "@server/shared/PrimaryDatabase";
import type { DeleteResult, Repository } from "typeorm";
import type { IRepository } from "./IRepository";

export class UserRepository implements IRepository<UserEntity> {
	private database: PrimaryDatabase;

	constructor() {
		this.database = primaryDatabase;
	}

	async open(): Promise<Repository<UserEntity>> {
		return await this.database.open(UserEntity);
	}

	async close(): Promise<void> {
		await this.database.close();
	}

	async getOne(id: string): Promise<UserEntity | null> {
		const repository = await this.open();
		return await repository.findOne({
			where: {
				id,
			},
		});
	}

	async getAll(): Promise<UserEntity[]> {
		const repository = await this.open();
		return await repository.find();
	}

	async create(data: Partial<UserEntity>): Promise<UserEntity> {
		const repository = await this.open();
		return await repository.save(data);
	}

	async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
		const repository = await this.open();
		const user = await repository.findOne({
			where: {
				id,
			},
		});
		if (!user) {
			throw new Error(`User with id ${id} not found`);
		}
		return await repository.save({ ...user, ...data });
	}

	async delete(id: string): Promise<DeleteResult> {
		const repo = await this.open();
		return await repo.delete({ id });
	}

	async findByEmail(email: string): Promise<UserEntity | null> {
		const repo = await this.open();
		return await repo.findOne({ where: { email } });
	}
	// async getByOptions(options: Partial<User>): Promise<User[]> {
	// 	const repository = await this.open();

	// 	// Build a clean where object by removing undefined/null values
	// 	const where: Partial<Record<keyof User, any>> = {};
	// 	for (const [key, value] of Object.entries(options)) {
	// 		if (value === undefined || value === null) continue;
	// 		where[key as keyof User] = value as any;
	// 	}

	// 	// This performs exact matches on provided fields. If you need partial
	// 	// matches, array intersection, or case-insensitive matching, use QueryBuilder.
	// 	return await repository.find({ where: where as any });
	// }
	// TO IMPLEMENT THIS OPTION
}

export const userRepository = new UserRepository();
