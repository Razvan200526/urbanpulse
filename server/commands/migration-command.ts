/** biome-ignore-all lint/suspicious/noConsole: <should log> */
import {
	assertRequiredDatabaseExtensions,
	bootstrapDatabaseExtensions,
	createDatabaseClient,
} from "@server/db/contract";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import figures from "figures";
import * as p from "picocolors";
import PrettyError from "pretty-error";

const pe = new PrettyError();

try {
	const connection = createDatabaseClient();
	const db = drizzle(connection);

	await bootstrapDatabaseExtensions(connection);
	await migrate(db, { migrationsFolder: "drizzle" });
	await assertRequiredDatabaseExtensions(connection);
	await connection.end();
} catch (error) {
	if (error instanceof Error) {
		console.error(pe.render(error));
		console.log(error.stack);
	}
	process.exit(1);
}

console.log(
	p.magentaBright(`${figures.tick} Migrations applied successfully!`),
);

process.exit();
