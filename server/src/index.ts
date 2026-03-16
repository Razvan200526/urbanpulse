import { websocket } from "hono/bun";
import PrettyError from "pretty-error";
import app from "./app";
import { parseEnv } from "./env";
import { logger } from "./utils/Logger";

export const pe = new PrettyError();
pe.start();
parseEnv();

const server = Bun.serve({
	port: Bun.env.PORT,
	hostname: "0.0.0.0",
	fetch: app.fetch,
	websocket,
});

logger.info(`Backend running at http://localhost:${server.port}`);
