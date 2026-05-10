import { zValidator } from "@hono/zod-validator";
import { adminMiddleware } from "@server/middleware/adminMiddleware";
import { authMiddleware } from "@server/middleware/authMiddleware";
import { notificationRepository } from "@server/repositories/NotificationRepository";
import { pulseRepository } from "@server/repositories/PulseRepository";
import { reportRepository } from "@server/repositories/ReportRepository";
import { resourceRepository } from "@server/repositories/ResourceRepository";
import { transactionRepository } from "@server/repositories/TransactionRepository";
import { userRepository } from "@server/repositories/UserRepository";
import { clusteringService } from "@server/services/ClusterigService";
import { documentMatchingService } from "@server/services/DocumentMatchingService";
import { incidentTypeService } from "@server/services/IncidentTypeService";
import { moderationService } from "@server/services/ModerationService";
import { createCrisisSchema } from "@shared/validators/admin/isCreateCrisisValid";
import { mergePulseSchema } from "@shared/validators/admin/isMergePulseValid";
import {
	moderatePulseParamsSchema,
	moderatePulseSchema,
} from "@shared/validators/admin/isModeratePulseValid";
import {
	createIncidentTypeSchema,
	incidentTypeIdParamSchema,
	updateIncidentTypeSchema,
} from "@shared/validators/incident-types/isIncidentTypeValid";
import {
	reviewReportParamsSchema,
	reviewReportSchema,
} from "@shared/validators/reports/isReviewReportValid";
import { Hono } from "hono";
import { z } from "zod";

const lostDocumentIdParamSchema = z.object({
	documentId: z.string().uuid(),
});

const rematchDocumentQuerySchema = z
	.object({
		renotifyExisting: z.enum(["true", "false"]).optional(),
	})
	.optional();

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
		const recentPulses = await Promise.all(
			pulses
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
				.slice(0, 5)
				.map(async (pulse) => ({
					...pulse,
					incidentType: pulse.incidentTypeId
						? await incidentTypeService.getIncidentTypeById(
								pulse.incidentTypeId,
							)
						: null,
				})),
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
				recentPulses,
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
	.get("/incident-types", async (c) => {
		const incidentTypes = await incidentTypeService.listAllIncidentTypes();

		return c.json({
			success: true,
			message: "Admin incident types retrieved",
			data: incidentTypes,
		});
	})
	.post(
		"/incident-types",
		zValidator("json", createIncidentTypeSchema),
		async (c) => {
			const result = await incidentTypeService.createIncidentType(
				c.req.valid("json"),
			);

			if (!result.ok) {
				const status = result.code === "CONFLICT" ? 409 : 400;
				return c.json(
					{ success: false, message: result.message, data: null },
					status,
				);
			}

			return c.json(
				{
					success: true,
					message: "Incident type created",
					data: result.data.incidentType,
				},
				201,
			);
		},
	)
	.patch(
		"/incident-types/:id",
		zValidator("param", incidentTypeIdParamSchema),
		zValidator("json", updateIncidentTypeSchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const result = await incidentTypeService.updateIncidentType(
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
				message: "Incident type updated",
				data: result.data.incidentType,
			});
		},
	)
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
	})
	.post("/crisis", zValidator("json", createCrisisSchema), async (c) => {
		const payload = c.req.valid("json");
		const incidentType = await incidentTypeService.getIncidentTypeById(
			payload.incidentTypeId,
		);
		if (!incidentType) {
			return c.json(
				{
					success: false,
					message: "Incident type not found",
					data: null,
				},
				404,
			);
		}
		const cluster = await clusteringService.createAdminCrisisCluster(payload);
		const serializedCluster = {
			id: cluster.id,
			pulse_type: cluster.pulseType,
			incident_type_id: cluster.incidentTypeId,
			center_lat: cluster.centerLat,
			center_lng: cluster.centerLng,
			radius_meters: cluster.radiusMeters,
			report_count: cluster.reportCount,
			confidence_score: cluster.confidenceScore,
			status: cluster.status,
			crisis_triggered: cluster.crisisTriggered,
			created_at: cluster.createdAt,
			updated_at: cluster.updatedAt,
			expires_at: cluster.expiresAt,
		};

		return c.json(
			{
				success: true,
				message:
					payload.scope === "global"
						? "Global crisis mode activated"
						: "Local crisis mode activated",
				data: { cluster: serializedCluster },
			},
			201,
		);
	})
	.post(
		"/lost-documents/:documentId/rematch",
		zValidator("param", lostDocumentIdParamSchema),
		zValidator("query", rematchDocumentQuerySchema),
		async (c) => {
			const { documentId } = c.req.valid("param");
			const query = c.req.valid("query");
			const result = await documentMatchingService.rematchDocumentAsAdmin({
				documentId,
				renotifyExisting: query?.renotifyExisting !== "false",
			});

			if (!result.success) {
				return c.json(
					{
						success: false,
						message: result.error,
						data: null,
					},
					result.error === "Document not found" ? 404 : 400,
				);
			}

			return c.json({
				success: true,
				message: "Document rematch completed",
				data: result,
			});
		},
	);
