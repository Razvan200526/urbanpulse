import PrettyError from "pretty-error";
import app from "./app";
import { websocket } from "hono/bun";
import { logger } from "./utils/Logger";
import { parseEnv } from "./env";

export const pe = new PrettyError();
pe.start();
parseEnv();

const server = Bun.serve({
	port: Bun.env.PORT,
	hostname: "localhost",
	fetch: app.fetch,
	websocket,
});

logger.info(`Backend running at http://localhost:${server.port}`);
