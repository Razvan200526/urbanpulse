import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authController } from "./controllers/AuthController";
import { userController } from "./controllers/UserController";
export const app = new Hono()
	.use(logger())
	.use(
		"/*",
		cors({
			origin: [Bun.env.CLIENT_URL || "http://localhost:5173"],
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: ["POST", "GET", "OPTIONS"],
			exposeHeaders: ["Content-Length"],
			maxAge: 600,
			credentials: true,
		}),
	)
	.route("/api/auth", authController)
	.route("/api/users", userController);

export type AppType = typeof app;
export default app;
