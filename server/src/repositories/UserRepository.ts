import { db } from "@server/db";
import type { UserType } from "@server/db/schema";
import { user } from "@server/db/schema";
import { eq } from "drizzle-orm";
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
}

export const userRepository = new UserRepository();
