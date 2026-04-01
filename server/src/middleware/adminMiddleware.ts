import type { Variables } from "@server/app";
import { createMiddleware } from "hono/factory";

export const adminMiddleware = createMiddleware<{ Variables: Variables }>(
	async (c, next) => {
		const user = c.get("user");

		if (!user || user.role !== "admin") {
			return c.json({ error: "Unauthorized" }, 401);
		}

		await next();
	},
);
