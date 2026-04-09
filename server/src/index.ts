import "./utils/PrettyError";
import { cacheManager } from "@server/services/cache/CacheManager";
import { websocket } from "hono/bun";
import app from "./app";
import { parseEnv } from "./env";
import { logger } from "./utils/Logger";

async function shutdown(signal: string) {
	logger.info(`Received ${signal}, shutting down backend`);
	await cacheManager.shutdown();
	process.exit(0);
}

async function bootstrap() {
	const env = parseEnv();
	await cacheManager.init(env.NODE_ENV === "production");

	const server = Bun.serve({
		port: Bun.env.PORT,
		hostname: "0.0.0.0",
		fetch: app.fetch,
		websocket,
	});

	process.on("SIGINT", () => {
		void shutdown("SIGINT");
	});

	process.on("SIGTERM", () => {
		void shutdown("SIGTERM");
	});

	logger.info(`Backend running at http://localhost:${server.port}`);
}

void bootstrap().catch(async (error) => {
	if (error instanceof Error) {
		logger.exception(error);
	}

	await cacheManager.shutdown();
	process.exit(1);
});
