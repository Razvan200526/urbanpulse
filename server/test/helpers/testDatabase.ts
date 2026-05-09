import { resolve } from "node:path";
import {
	bootstrapDatabaseExtensions,
	createDatabaseClient,
	getDatabaseUrl,
} from "@server/db/contract";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

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
	'"incident_type"',
	'"user"',
] as const;

let testClient: ReturnType<typeof createDatabaseClient> | null = null;

export async function initializeRunDatabase() {
	if (testClient) {
		return testClient;
	}

	const databaseUrl = getDatabaseUrl();
	const client = createDatabaseClient(databaseUrl);

	try {
		await client`select 1`;
	} catch (error) {
		await client.end({ timeout: 1 });
		throw new Error(
			`Unable to connect to the test database at ${databaseUrl}. Start it first, for example with \`docker compose -f docker-compose.test.yaml up -d\`.`,
			{ cause: error },
		);
	}

	await bootstrapDatabaseExtensions(client);

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
