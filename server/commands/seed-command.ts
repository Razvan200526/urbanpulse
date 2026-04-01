/** biome-ignore-all lint/suspicious/noConsole: <should log success or errors> */

import * as schema from "@server/db/schema";
import { seedDatabase } from "@server/seed";
import { drizzle } from "drizzle-orm/postgres-js";
import figures from "figures";
import * as p from "picocolors";
import postgres from "postgres";
import PrettyError from "pretty-error";

const pe = new PrettyError();
const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
	console.error("DATABASE_URL is required.");
	process.exit(1);
}

try {
	const connection = postgres(databaseUrl, { max: 1 });
	const db = drizzle(connection, { schema });

	await seedDatabase(db);
	await connection.end();
} catch (error) {
	if (error instanceof Error) {
		console.error(pe.render(error));
	} else {
		console.log(error);
	}
	process.exit(1);
}

console.log(p.magentaBright(`${figures.tick} Seed applied successfully!`));

process.exit();
