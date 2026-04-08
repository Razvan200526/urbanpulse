import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const APP_TABLES = [
	'"account"',
	'"session"',
	'"verification"',
	'"conversation_member"',
	'"message_receipt"',
	'"message"',
	'"notification"',
	'"pet_match"',
	'"pet_alert"',
	'"pulse_confirmation"',
	'"response"',
	'"quiet_hours"',
	'"report"',
	'"transaction"',
	'"skill"',
	'"resources"',
	'"conversation"',
	'"pulse"',
	'"user"',
] as const;

type SqlClient = ReturnType<typeof postgres>;

let testClient: SqlClient | null = null;

function getDatabaseUrl() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error(
			"DATABASE_URL is required for repository integration tests.",
		);
	}
	return databaseUrl;
}

export async function initializeRunDatabase() {
	if (testClient) {
		return testClient;
	}

	const databaseUrl = getDatabaseUrl();
	const client = postgres(databaseUrl, {
		max: 1,
		onnotice: () => {},
	});

	try {
		await client`select 1`;
	} catch (error) {
		await client.end({ timeout: 1 });
		throw new Error(
			`Unable to connect to the test database at ${databaseUrl}. Start it first, for example with \`docker compose -f docker-compose.test.yaml up -d\`.`,
			{ cause: error },
		);
	}

	await client.unsafe("CREATE EXTENSION IF NOT EXISTS pgcrypto");
	await client.unsafe("CREATE EXTENSION IF NOT EXISTS postgis");

	const migrationDb = drizzle(client);
	await migrate(migrationDb, {
		migrationsFolder: resolve(import.meta.dir, "../../drizzle"),
	});

	testClient = client;
	return testClient;
}

export async function resetDatabase() {
	const client = await initializeRunDatabase();
	await client.unsafe(
		`TRUNCATE TABLE ${APP_TABLES.join(", ")} RESTART IDENTITY CASCADE`,
	);
}

export async function disposeRunDatabase() {
	if (!testClient) {
		return;
	}

	const client = testClient;
	testClient = null;

	const { db } = await import("@server/db");
	await db.$client.end();
	await client.end({ timeout: 1 });
}
