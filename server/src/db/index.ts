import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const db = drizzle({
	// biome-ignore lint/style/noNonNullAssertion: <trust me>
	connection: process.env.DATABASE_URL!,
	schema,
});
