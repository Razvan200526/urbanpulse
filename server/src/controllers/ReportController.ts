import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@server/middleware/authMiddleware";
import { moderationService } from "@server/services/ModerationService";
import { createReportSchema } from "@shared/validators/reports/isCreateReportValid";
import { Hono } from "hono";

export const reportController = new Hono()
	.basePath("/reports")
	.use(authMiddleware)
	.post("/", zValidator("json", createReportSchema), async (c) => {
		const session = c.var.session;
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const result = await moderationService.createReport(
			session.userId,
			c.req.valid("json"),
		);

		if (!result.ok) {
			const status =
				result.code === "NOT_FOUND"
					? 404
					: result.code === "CONFLICT"
						? 409
						: result.code === "FORBIDDEN"
							? 403
							: 400;

			return c.json(
				{ success: false, message: result.message, data: null },
				status,
			);
		}

		return c.json({
			success: true,
			message: "Report submitted",
			data: result.data,
		});
	});
