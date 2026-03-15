import { Hono } from "hono";
import { cors } from "hono/cors";
import { authService } from "./services/AuthService";
export const app = new Hono();

app.use(
	"/api/auth/*",
	cors({
		origin: Bun.env.CLIENT_URL,
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return authService.handler(c.req.raw);
});

export default app;
