import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { rateLimiter } from "hono-rate-limiter";
import { authController } from "./controllers/AuthController";
import { avatarController } from "./controllers/AvatarController";
import { notificationController } from "./controllers/NotificationController";
import { pulseController } from "./controllers/PulseController";
import { userController } from "./controllers/UserController";
import { resourceController } from "./controllers/ResourceController";
export const app = new Hono()
	.use(
		rateLimiter({
			windowMs: 60 * 1000,
			limit: 1000,
			keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "",
		}),
	)
	.use(logger())
	.basePath("/api")
	.use(
		"/*",
		cors({
			origin: [Bun.env.CLIENT_URL || "http://localhost:5173"],
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: [
				"POST",
				"GET",
				"OPTIONS",
				"PATCH",
				"DELETE",
				"PUT",
				"HEAD",
			],
			exposeHeaders: ["Content-Length"],
			maxAge: 600,
			credentials: true,
		}),
	)
	.route("/auth", authController)
	.route("/users", userController)
	.route("/avatar", avatarController)
	.route("/pulse", pulseController)
	.route("/notifications", notificationController)
	.route("/resources", resourceController);

export type AppType = typeof app;
export default app;
