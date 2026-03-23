import { logger } from "@server/utils/Logger";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";

export const pulseController = new Hono().get(
	"/ws",
	upgradeWebSocket(() => {
		return {
			onOpen: (event) => {
				logger.info(JSON.stringify(event));
			},
			onClose: () => {},
		};
	}),
);
