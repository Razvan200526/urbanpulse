import { zValidator } from "@hono/zod-validator";
import { adminMiddleware } from "@server/middleware/adminMiddleware";
import { authMiddleware } from "@server/middleware/authMiddleware";
import { lostDocumentRepository } from "@server/repositories/LostDocumentRepository";
import { notificationRepository } from "@server/repositories/NotificationRepository";
import { pulseRepository } from "@server/repositories/PulseRepository";
import { reportRepository } from "@server/repositories/ReportRepository";
import { resourceRepository } from "@server/repositories/ResourceRepository";
import { transactionRepository } from "@server/repositories/TransactionRepository";
import { userRepository } from "@server/repositories/UserRepository";
import { clusteringService } from "@server/services/ClusterigService";
import { documentImageService } from "@server/services/DocumentImageService";
import { documentMatchingService } from "@server/services/DocumentMatchingService";
import { incidentTypeService } from "@server/services/IncidentTypeService";
import { moderationService } from "@server/services/ModerationService";
import { LostDocumentEmbeddingStatusEnum } from "@shared/types";
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

const rematchAllDocumentsQuerySchema = z
	.object({
		renotifyExisting: z.enum(["true", "false"]).optional(),
	})
	.optional();

const crisisClusterIdParamSchema = z.object({
	clusterId: z.string().uuid(),
});

const toggleCrisisSchema = z.object({
	isActive: z.boolean(),
});

const listLostDocumentsQuerySchema = z
	.object({
		limit: z.coerce.number().int().min(1).max(100).optional(),
		embeddingStatus: z.nativeEnum(LostDocumentEmbeddingStatusEnum).optional(),
	})
	.optional();

const serializeCluster = (cluster: {
	id: string;
	pulseType?: string | null;
	pulse_type?: string | null;
	incidentTypeId?: string | null;
	incident_type_id?: string | null;
	centerLat?: number | null;
	center_lat?: number | null;
	centerLng?: number | null;
	center_lng?: number | null;
	radiusMeters?: number | null;
	radius_meters?: number | null;
	reportCount?: number | null;
	report_count?: number | null;
	confidenceScore?: number | null;
	confidence_score?: number | null;
	status?: string | null;
	crisisTriggered?: boolean | null;
	crisis_triggered?: boolean | null;
	createdAt?: Date | null;
	created_at?: Date | null;
	updatedAt?: Date | null;
	updated_at?: Date | null;
	expiresAt?: Date | null;
	expires_at?: Date | null;
}) => ({
	id: cluster.id,
	pulse_type: cluster.pulseType ?? cluster.pulse_type ?? null,
	incident_type_id: cluster.incidentTypeId ?? cluster.incident_type_id ?? null,
	center_lat: cluster.centerLat ?? cluster.center_lat ?? null,
	center_lng: cluster.centerLng ?? cluster.center_lng ?? null,
	radius_meters: cluster.radiusMeters ?? cluster.radius_meters ?? null,
	report_count: cluster.reportCount ?? cluster.report_count ?? null,
	confidence_score: cluster.confidenceScore ?? cluster.confidence_score ?? null,
	status: cluster.status,
	crisis_triggered: cluster.crisisTriggered ?? cluster.crisis_triggered ?? null,
	created_at: cluster.createdAt ?? cluster.created_at ?? null,
	updated_at: cluster.updatedAt ?? cluster.updated_at ?? null,
	expires_at: cluster.expiresAt ?? cluster.expires_at ?? null,
});

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
		const serializedCluster = serializeCluster(cluster);

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
	.get("/crisis", async (c) => {
		const clusters = await clusteringService.getActiveCrisisClusters();

		return c.json({
			success: true,
			message: "Active crisis clusters retrieved",
			data: {
				clusters: clusters.map((cluster) => serializeCluster(cluster)),
			},
		});
	})
	.patch(
		"/crisis/:clusterId",
		zValidator("param", crisisClusterIdParamSchema),
		zValidator("json", toggleCrisisSchema),
		async (c) => {
			const { clusterId } = c.req.valid("param");
			const payload = c.req.valid("json");

			if (payload.isActive) {
				return c.json(
					{
						success: false,
						message:
							"To activate crisis mode, use the dedicated create crisis endpoint",
						data: null,
					},
					400,
				);
			}

			const result = await clusteringService.deactivateCrisisCluster(clusterId);
			if (!result) {
				return c.json(
					{
						success: false,
						message: "Active crisis cluster not found",
						data: null,
					},
					404,
				);
			}

			return c.json({
				success: true,
				message:
					result.scope === "global"
						? "Global crisis mode deactivated"
						: "Local crisis mode deactivated",
				data: {
					cluster: serializeCluster(result.cluster),
				},
			});
		},
	)
	.get(
		"/lost-documents",
		zValidator("query", listLostDocumentsQuerySchema),
		async (c) => {
			const query = c.req.valid("query");
			const limit = query?.limit ?? 20;

			let documents = await lostDocumentRepository.getAll();
			if (query?.embeddingStatus) {
				documents = documents.filter(
					(document) => document.embeddingStatus === query.embeddingStatus,
				);
			}

			const limited = documents.slice(0, limit);
			const documentsWithMatches = await Promise.all(
				limited.map(async (document) => {
					const matches = await lostDocumentRepository.getMatchesWithUserInfo(
						document.id,
						0,
					);
					const originalImageUrl = await documentImageService
						.getSignedUrl(document.originalImageKey)
						.catch(() => null);

					return {
						id: document.id,
						userId: document.userId,
						documentType: document.documentType,
						extractedName: document.extractedName,
						extractedFirstName: document.extractedFirstName,
						extractedBirthYear: document.extractedBirthYear,
						extractedCity: document.extractedCity,
						originalImageKey: document.originalImageKey,
						blurredImageUrl: document.blurredImageUrl,
						embeddingStatus: document.embeddingStatus,
						embeddingUpdatedAt: document.embeddingUpdatedAt,
						createdAt: document.createdAt,
						updatedAt: document.updatedAt,
						matchCount: matches.length,
						originalImageUrl,
					};
				}),
			);

			return c.json({
				success: true,
				message: "Admin lost documents retrieved",
				data: {
					documents: documentsWithMatches,
				},
			});
		},
	)
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
	)
	.post(
		"/lost-documents/rematch-all",
		zValidator("query", rematchAllDocumentsQuerySchema),
		async (c) => {
			const query = c.req.valid("query");
			const result = await documentMatchingService.rematchAllDocumentsAsAdmin({
				renotifyExisting: query?.renotifyExisting === "true",
			});

			return c.json({
				success: true,
				message: "Document rematch completed for all uploads",
				data: result,
			});
		},
	);
