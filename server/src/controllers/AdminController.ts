import { zValidator } from "@hono/zod-validator";
import { adminMiddleware } from "@server/middleware/adminMiddleware";
import { authMiddleware } from "@server/middleware/authMiddleware";
import { notificationRepository } from "@server/repositories/NotificationRepository";
import { pulseRepository } from "@server/repositories/PulseRepository";
import { reportRepository } from "@server/repositories/ReportRepository";
import { resourceRepository } from "@server/repositories/ResourceRepository";
import { transactionRepository } from "@server/repositories/TransactionRepository";
import { userRepository } from "@server/repositories/UserRepository";
import { moderationService } from "@server/services/ModerationService";
import { mergePulseSchema } from "@shared/validators/admin/isMergePulseValid";
import {
	moderatePulseParamsSchema,
	moderatePulseSchema,
} from "@shared/validators/admin/isModeratePulseValid";
import {
	reviewReportParamsSchema,
	reviewReportSchema,
} from "@shared/validators/reports/isReviewReportValid";
import { Hono } from "hono";

export const adminController = new Hono()
	.basePath("/admin")
	.use(authMiddleware)
	.use(adminMiddleware)
	.get("/overview", async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}
		const [users, pulses, resources, reports, transactions, notifications] =
			await Promise.all([
				userRepository.getAll(),
				pulseRepository.getAll(),
				resourceRepository.getAll(),
				reportRepository.getAll(),
				transactionRepository.getAll(),
				notificationRepository.getAll(),
			]);

		const sortedReports = reports.sort(
			(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
		);
		const sortedResources = resources.sort(
			(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
		);

		return c.json({
			success: true,
			message: "Admin overview retrieved",
			data: {
				counts: {
					users: users.length,
					pulses: pulses.length,
					resources: resources.length,
					reports: reports.length,
					transactions: transactions.length,
					notifications: notifications.length,
				},
				recentReports: sortedReports.slice(0, 5),
				recentPulses: pulses
					.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
					.slice(0, 5),
				recentResources: sortedResources.slice(0, 5),
			},
		});
	})
	.get("/reports", async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const reports = await moderationService.getAdminReportQueue();

		return c.json({
			success: true,
			message: "Admin reports retrieved",
			data: {
				reports,
			},
		});
	})
	.get("/duplicates", async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const duplicates = await moderationService.getDuplicatePulseCandidates();

		return c.json({
			success: true,
			message: "Duplicate pulse candidates retrieved",
			data: {
				duplicates,
			},
		});
	})
	.patch(
		"/reports/:id",
		zValidator("param", reviewReportParamsSchema),
		zValidator("json", reviewReportSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const result = await moderationService.reviewReport(
				id,
				c.req.valid("json"),
			);

			if (!result.ok) {
				const status = result.code === "NOT_FOUND" ? 404 : 400;
				return c.json(
					{ success: false, message: result.message, data: null },
					status,
				);
			}

			return c.json({
				success: true,
				message: "Report reviewed",
				data: result.data,
			});
		},
	)
	.patch(
		"/pulses/:id",
		zValidator("param", moderatePulseParamsSchema),
		zValidator("json", moderatePulseSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const result = await moderationService.moderatePulse(
				id,
				c.req.valid("json"),
			);

			if (!result.ok) {
				const status = result.code === "NOT_FOUND" ? 404 : 400;
				return c.json(
					{ success: false, message: result.message, data: null },
					status,
				);
			}

			return c.json({
				success: true,
				message: "Pulse moderated",
				data: result.data,
			});
		},
	)
	.post("/pulses/merge", zValidator("json", mergePulseSchema), async (c) => {
		const result = await moderationService.mergePulse(c.req.valid("json"));

		if (!result.ok) {
			const status = result.code === "NOT_FOUND" ? 404 : 400;
			return c.json(
				{ success: false, message: result.message, data: null },
				status,
			);
		}

		return c.json({
			success: true,
			message: "Pulses merged",
			data: result.data,
		});
	});
