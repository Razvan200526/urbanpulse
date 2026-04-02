import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { rateLimiter } from "hono-rate-limiter";
import { adminController } from "./controllers/AdminController";
import { authController } from "./controllers/AuthController";
import { avatarController } from "./controllers/AvatarController";
import { dashboardController } from "./controllers/DashboardController";
import { healthController } from "./controllers/HealthController";
import { notificationController } from "./controllers/NotificationController";
import { pulseController } from "./controllers/PulseController";
import { reportController } from "./controllers/ReportController";
import { resourceController } from "./controllers/ResourceController";
import { uploadController } from "./controllers/UploadController";
import { userController } from "./controllers/UserController";
import { weatherController } from "./controllers/WeatherController";
import type { UserType } from "./db/schema";
import { authMiddleware } from "./middleware/authMiddleware";
import type auth from "./services/auth/AuthService";
import { getCorsOrigin } from "./utils/getAllowedOrigins";
export type Variables = {
	user: UserType | null;
	session: typeof auth.$Infer.Session.session | null;
};
export const app = new Hono<{ Variables: Variables }>()
	.use(
		"/*",
		cors({
			origin: (origin) => getCorsOrigin(origin),
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
	.use(
		rateLimiter({
			windowMs: 60 * 1000,
			limit: 1000,
			keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "",
		}),
	)
	.use(authMiddleware)
	.use(logger())
	.basePath("/api")
	.route("/", healthController)
	.route("/", authController)
	.route("/", userController)
	.route("/", avatarController)
	.route("/", pulseController)
	.route("/", notificationController)
	.route("/", reportController)
	.route("/", resourceController)
	.route("/", dashboardController)
	.route("/", uploadController)
	.route("/", adminController)
	.route("/", weatherController);

export type AppType = typeof app;
export default app;
