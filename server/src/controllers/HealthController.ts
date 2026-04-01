import { Hono } from "hono";

export const healthController = new Hono().get("/health", (c) => {
	return c.json({ status: "ok" });
});
