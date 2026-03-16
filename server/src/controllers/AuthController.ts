import authService from "@server/services/AuthService";
import { Hono } from "hono";

export const authController = new Hono().on(["POST", "GET"], "/*", (c) => {
	return authService.handler(c.req.raw);
});
