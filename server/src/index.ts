import "./utils/PrettyError";
import { websocket } from "hono/bun";
import app from "./app";
import { parseEnv } from "./env";
import { logger } from "./utils/Logger";

parseEnv();

const server = Bun.serve({
	port: Bun.env.PORT,
	hostname: "0.0.0.0",
	fetch: app.fetch,
	websocket,
});

logger.info(`Backend running at http://localhost:${server.port}`);
