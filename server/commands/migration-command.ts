/** biome-ignore-all lint/suspicious/noConsole: <should log> */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import figures from "figures";
import * as p from "picocolors";
import postgres from "postgres";
import PrettyError from "pretty-error";

const pe = new PrettyError();

try {
	const connection = postgres(process.env.DATABASE_URL, { max: 1 });
	const db = drizzle(connection);

	await migrate(db, { migrationsFolder: "drizzle" });
	await connection.end();
} catch (error) {
	if (error instanceof Error) {
		console.error(pe.render(error));
	} else {
		console.log(error);
	}
	process.exit(1);
}

console.log(
	p.magentaBright(`${figures.tick} Migrations applied successfully!`),
);

process.exit();
