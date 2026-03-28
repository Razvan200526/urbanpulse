import * as z from "zod";
import { printZodError } from "./utils/printZodError";

export const envSchema = z.object({
	NODE_ENV: z.enum(["development", "staging", "production"]),
	DATABASE_URL: z.string(),
	PORT: z.number().optional(),
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
	RESEND_API_KEY: z.string(),
	BETTER_AUTH_API_KEY: z.string(),
	GITHUB_CLIENT_ID: z.string(),
	GITHUB_CLIENT_SECRET: z.string(),
	GOOGLE_CLIENT_ID: z.string(),
	GOOGLE_CLIENT_SECRET: z.string(),
	/** Optional: enables /api/weather/alerts for dashboard safety banner */
	OPENWEATHER_API_KEY: z.string().optional(),
});

export function parseEnv() {
	const { error } = envSchema.safeParse(Bun.env);
	if (error) {
		printZodError(error);
	}
}

declare module "bun" {
	interface Env extends z.TypeOf<typeof envSchema> {}
}
