import * as z from "zod";
import { printZodError } from "./utils/printZodError";

export const envSchema = z.object({
	NODE_ENV: z.enum(["development", "staging", "production"]),
	DATABASE_URL: z.string(),
	PORT: z.coerce.number().optional(),
	BETTER_AUTH_SECRET: z.string(),
	BETTER_AUTH_URL: z.string(),
	SERVER_URL: z.string(),
	CLIENT_URL: z.string(),
	R2_ENDPOINT: z.string(),
	R2_ACCESS_KEY: z.string(),
	R2_SECRET_ACCESS_KEY: z.string(),
	R2_TOKEN: z.string(),
	R2_DOMAIN: z.string(),
	R2_BUCKET_NAME: z.string(),
	R2_BUCKET: z.string().optional(),
	RESEND_API_KEY: z.string(),
	BETTER_AUTH_API_KEY: z.string(),
	GITHUB_CLIENT_ID: z.string(),
	GITHUB_CLIENT_SECRET: z.string(),
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
	GEMINI_API_KEY: z.string(),
	MAPBOX_API_KEY: z.string(),
	MAPBOX_URL: z.string(),
	REDIS_URL: z.string(),
	VALKEY_URL: z.string().optional(),
});

export function parseEnv() {
	if (!Bun.env.R2_BUCKET_NAME && Bun.env.R2_BUCKET) {
		Bun.env.R2_BUCKET_NAME = Bun.env.R2_BUCKET;
	}

	if (!Bun.env.REDIS_URL && Bun.env.VALKEY_URL) {
		Bun.env.REDIS_URL = Bun.env.VALKEY_URL;
	}

	if (!Bun.env.REDIS_URL && Bun.env.NODE_ENV !== "production") {
		Bun.env.REDIS_URL = "redis://localhost:6379";
	}

	const parsed = envSchema.safeParse(Bun.env);
	if (!parsed.success) {
		printZodError(parsed.error);
		throw new Error("Invalid environment configuration");
	}

	return parsed.data;
}

declare module "bun" {
	interface Env extends z.TypeOf<typeof envSchema> {}
}
