import auth from "@server/services/AuthService";
import { Hono } from "hono";

export const authController = new Hono().on(["POST", "GET"], "/*", (c) => {
	return auth.handler(c.req.raw);
});
