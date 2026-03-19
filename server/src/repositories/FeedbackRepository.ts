// import { db } from "@server/db";
// // import { feedback, type FeedbackType } from "@server/db/schema";
// import { eq } from "drizzle-orm";
// import type { IRepository } from "./IRepository";

// export class FeedbackRepository implements IRepository<FeedbackType> {
// 	async getOne(id: string): Promise<FeedbackType | null> {
// 		const [result] = await db.select().from(feedback).where(eq(feedback.id, id as any));
// 		return result || null;
// 	}

// 	async getAll(): Promise<FeedbackType[]> {
// 		return await db.select().from(feedback);
// 	}

// 	async create(data: Partial<FeedbackType>): Promise<FeedbackType | null> {
// 		const [result] = await db.insert(feedback).values(data as any).returning();
// 		return result ?? null;
// 	}

// 	async update(id: string, data: Partial<FeedbackType>): Promise<FeedbackType> {
// 		const [result] = await db
// 			.update(feedback)
// 			.set(data as any)
// 			.where(eq(feedback.id, id as any))
// 			.returning();
// 		if (!result) {
// 			throw new Error(`FeedbackRepository: Record with id ${id} not found`);
// 		}
// 		return result;
// 	}

// 	async delete(id: string): Promise<any> {
// 		await db.delete(feedback).where(eq(feedback.id, id as any));
// 		return { affected: 1 };
// 	}
// }

// export const feedbackRepository = new FeedbackRepository();
