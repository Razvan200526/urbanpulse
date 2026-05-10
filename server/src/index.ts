import "./utils/PrettyError";
import { cacheManager } from "@server/services/cache/CacheManager";
import { documentRematchCronService } from "@server/services/DocumentRematchCronService";
import { failedLostDocumentCleanupCronService } from "@server/services/FailedLostDocumentCleanupCronService";
import { websocket } from "hono/bun";
import app from "./app";
import { parseEnv } from "./env";
import { logger } from "./utils/Logger";

async function shutdown(signal: string) {
	logger.info(`Received ${signal}, shutting down backend`);
	documentRematchCronService.stop();
	failedLostDocumentCleanupCronService.stop();
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

	const internalSecret =
		env.LOST_DOCUMENT_INTERNAL_SECRET || "dev-lost-document-secret";
	documentRematchCronService.start(
		`http://127.0.0.1:${server.port}`,
		internalSecret,
	);
	failedLostDocumentCleanupCronService.start(
		`http://127.0.0.1:${server.port}`,
		internalSecret,
	);

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
