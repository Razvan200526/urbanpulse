import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { rateLimiter } from "hono-rate-limiter";
import { authController } from "./controllers/AuthController";
import { avatarController } from "./controllers/AvatarController";
import { notificationController } from "./controllers/NotificationController";
import { pulseController } from "./controllers/PulseController";
import { resourceController } from "./controllers/ResourceController";
import { userController } from "./controllers/UserController";
import { uploadController } from "./controllers/UploadController";
import { weatherController } from "./controllers/WeatherController";
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
	.route("/", authController)
	.route("/", userController)
	.route("/", avatarController)
	.route("/", pulseController)
	.route("/", notificationController)
	.route("/", resourceController)
	.route("/", uploadController)
	.route("/", weatherController);

export type AppType = typeof app;
export default app;
