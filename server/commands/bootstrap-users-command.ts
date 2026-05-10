/** biome-ignore-all lint/suspicious/noConsole: CLI command should print actionable logs */

import * as schema from "@server/db/schema";
import { UserRole } from "@server/types";
import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
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

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const readRequiredEnv = (key: string) => {
	const value = Bun.env[key]?.trim();
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value;
};

const readOptionalEnv = (key: string, fallback: string) => {
	const value = Bun.env[key]?.trim();
	return value && value.length > 0 ? value : fallback;
};

const validatePassword = (password: string, key: string) => {
	if (password.length < 8) {
		throw new Error(`${key} must be at least 8 characters long.`);
	}
};

type Database = PostgresJsDatabase<typeof schema>;

const ensureCredentialUser = async (params: {
	db: Database;
	email: string;
	name: string;
	password: string;
	role: UserRole;
}) => {
	const now = new Date();
	const normalizedEmail = normalizeEmail(params.email);
	const passwordHash = await bcrypt.hash(params.password, 10);

	const [existingUser] = await params.db
		.select()
		.from(schema.user)
		.where(sql`LOWER(${schema.user.email}) = ${normalizedEmail}`)
		.limit(1);

	let userId = existingUser?.id;
	let action: "created" | "updated" = "updated";
	if (!existingUser) {
		action = "created";
		userId = `usr_${crypto.randomUUID()}`;
		await params.db.insert(schema.user).values({
			id: userId,
			name: params.name,
			email: normalizedEmail,
			emailVerified: true,
			role: params.role,
			createdAt: now,
			updatedAt: now,
			banned: false,
			isVerified: params.role === UserRole.ADMIN,
			rememberMe: false,
		});
	} else {
		await params.db
			.update(schema.user)
			.set({
				name: params.name,
				emailVerified: true,
				role: params.role,
				updatedAt: now,
				banned: false,
			})
			.where(eq(schema.user.id, existingUser.id));
	}

	if (!userId) {
		throw new Error(`Failed to resolve user id for ${normalizedEmail}`);
	}

	const existingCredentialsAccount = await params.db.query.account.findFirst({
		where: and(
			eq(schema.account.userId, userId),
			eq(schema.account.providerId, "credential"),
		),
	});

	if (!existingCredentialsAccount) {
		await params.db.insert(schema.account).values({
			id: `acc_${crypto.randomUUID()}`,
			accountId: normalizedEmail,
			providerId: "credential",
			userId,
			password: passwordHash,
			createdAt: now,
			updatedAt: now,
		});
	} else {
		await params.db
			.update(schema.account)
			.set({
				accountId: normalizedEmail,
				providerId: "credential",
				password: passwordHash,
				updatedAt: now,
			})
			.where(eq(schema.account.id, existingCredentialsAccount.id));
	}

	return {
		email: normalizedEmail,
		role: params.role,
		action,
	};
};

try {
	const adminEmail = readRequiredEnv("BOOTSTRAP_ADMIN_EMAIL");
	const adminPassword = readRequiredEnv("BOOTSTRAP_ADMIN_PASSWORD");
	validatePassword(adminPassword, "BOOTSTRAP_ADMIN_PASSWORD");
	const adminName = readOptionalEnv("BOOTSTRAP_ADMIN_NAME", "UrbanPulse Admin");

	const testUserEmail = readRequiredEnv("BOOTSTRAP_TEST_USER_EMAIL");
	const testUserPassword = readRequiredEnv("BOOTSTRAP_TEST_USER_PASSWORD");
	validatePassword(testUserPassword, "BOOTSTRAP_TEST_USER_PASSWORD");
	const testUserName = readOptionalEnv(
		"BOOTSTRAP_TEST_USER_NAME",
		"UrbanPulse Test User",
	);

	const connection = postgres(databaseUrl, { max: 1 });
	const db = drizzle(connection, { schema });

	const adminResult = await ensureCredentialUser({
		db,
		email: adminEmail,
		name: adminName,
		password: adminPassword,
		role: UserRole.ADMIN,
	});

	const testUserResult = await ensureCredentialUser({
		db,
		email: testUserEmail,
		name: testUserName,
		password: testUserPassword,
		role: UserRole.USER,
	});

	await connection.end();

	console.log(
		p.cyan(
			`${figures.tick} ${adminResult.action.toUpperCase()} admin user: ${adminResult.email}`,
		),
	);
	console.log(
		p.cyan(
			`${figures.tick} ${testUserResult.action.toUpperCase()} test user: ${testUserResult.email}`,
		),
	);
	console.log(
		p.magentaBright(
			`${figures.tick} Bootstrap complete. Both users can sign in with email/password without OTP verification step.`,
		),
	);
} catch (error) {
	if (error instanceof Error) {
		console.error(pe.render(error));
	} else {
		console.error(error);
	}
	process.exit(1);
}
