/** biome-ignore-all lint/suspicious/noConsole: <should log> */

import * as schema from "@server/db/schema";
import { getTableName, isTable } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { reset } from "drizzle-seed";
import figures from "figures";
import * as p from "picocolors";
import postgres from "postgres";
import PrettyError from "pretty-error";

const pe = new PrettyError();

const ensureDatabaseExists = async () => {
	const adminDb = "postgres";
	const adminUrl = new URL(Bun.env.DATABASE_URL);
	adminUrl.pathname = `/${adminDb}`;

	const adminConnection = postgres(adminUrl.toString(), { max: 1 });
	try {
		const existingDatabase = await adminConnection`
			SELECT 1
			FROM pg_database
			WHERE datname = ${adminUrl.pathname.replace(/^\//, "")}
			LIMIT 1
		`;

		if (existingDatabase.length === 0) {
			const escapedDatabaseName = adminUrl.pathname
				.replace(/^\//, "")
				.replace(/"/g, '""');
			await adminConnection.unsafe(`CREATE DATABASE "${escapedDatabaseName}"`);
			console.log(
				p.yellow(
					`Database "${adminUrl.pathname.replace(/^\//, "")}" did not exist. Created it before reset.`,
				),
			);
		}
	} finally {
		await adminConnection.end();
	}
};

try {
	await ensureDatabaseExists();

	const connection = postgres(Bun.env.DATABASE_URL, { max: 1 });
	try {
		const db = drizzle(connection);

		const allPublicTables = await connection<{ tableName: string }[]>`
			SELECT tablename AS "tableName"
			FROM pg_tables
			WHERE schemaname = 'public'
		`;

		const existingTableNames = new Set(allPublicTables.map((t) => t.tableName));
		const schemaEntries = Object.entries(schema).filter(([, value]) =>
			isTable(value),
		);
		const resettableSchemaEntries = schemaEntries.filter(([, value]) =>
			existingTableNames.has(getTableName(value as keyof typeof value)),
		);

		if (resettableSchemaEntries.length === 0) {
			console.log(
				p.yellow("No existing public tables found for schema reset. Skipping."),
			);
		} else {
			const schemaToReset = Object.fromEntries(resettableSchemaEntries);
			await reset(db, schemaToReset);
		}
	} finally {
		await connection.end();
	}
} catch (error) {
	if (error instanceof Error) {
		console.error(pe.render(error));
	}
	console.error(error);
	process.exit(1);
}

console.log(p.magentaBright(`${figures.tick} Database reset successfully!`));

process.exit();
