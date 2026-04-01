import { db } from "@server/db";
import type { UserType } from "@server/db/schema";
import { user } from "@server/db/schema";
import type { UserConditionOptions } from "@server/repositories/types";
import { and, eq, gte, lt } from "drizzle-orm";
import type { IRepository } from "./IRepository";

export class UserRepository implements IRepository<UserType> {
	async getOne(id: string): Promise<UserType | null> {
		const [result] = await db.select().from(user).where(eq(user.id, id));
		return result || null;
	}

	async getAll(): Promise<UserType[]> {
		return await db.select().from(user);
	}

	async create(data: Partial<UserType>): Promise<UserType | null> {
		const [result] = await db
			.insert(user)
			.values(data as any)
			.returning();
		return result ?? null;
	}

	async update(id: string, data: Partial<UserType>): Promise<UserType> {
		const [result] = await db
			.update(user)
			.set(data as any)
			.where(eq(user.id, id))
			.returning();
		if (!result) {
			throw new Error(`User with id ${id} not found`);
		}
		return result;
	}

	async delete(id: string): Promise<boolean> {
		const affected = await db.delete(user).where(eq(user.id, id)).returning();
		return affected.length > 0;
	}

	async findByEmail(email: string): Promise<UserType | null> {
		const [result] = await db.select().from(user).where(eq(user.email, email));
		return result || null;
	}

	/**
	 * Retrieves users by optional field filters and optional createdAt range condition.
	 * @param {Partial<UserType>} options - Column-value filters.
	 * @param {UserConditionOptions} [condition] - Optional createdAt range condition.
	 * @returns {Promise<UserType[]>} Matching user records.
	 */
	async getByOptions(
		options: Partial<UserType>,
		condition?: UserConditionOptions,
	): Promise<UserType[]> {
		const filters = Object.entries(options)
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => eq(user[key as keyof typeof user] as any, value));

		if (condition?.createdAtFrom) {
			filters.push(gte(user.createdAt, condition.createdAtFrom));
		}

		if (condition?.createdAtTo) {
			filters.push(lt(user.createdAt, condition.createdAtTo));
		}

		return await db
			.select()
			.from(user)
			.where(filters.length > 0 ? and(...filters) : undefined);
	}
}

export const userRepository = new UserRepository();
