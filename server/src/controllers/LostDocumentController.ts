import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { Variables } from "@server/app";
import { lostDocumentService } from "@server/services/LostDocumentService";
import { lostDocumentRepository } from "@server/repositories/LostDocumentRepository";
import { logger } from "@server/utils/Logger";

const fileSchema = z.object({
	document: z.instanceof(File),
});

export const lostDocumentController = new Hono<{ Variables: Variables }>()
	.basePath("/lost-documents")
	// POST /api/lost-documents - Upload document
	.post("/", zValidator("form", fileSchema), async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json({ success: false, error: "Unauthorized" }, 401);
		}

		try {
			const { document } = c.req.valid("form");
			const buffer = await document.arrayBuffer();

			const result = await lostDocumentService.uploadDocument(
				session.userId,
				Buffer.from(buffer),
			);

			if (!result.success) {
				return c.json(
					{ success: false, error: result.error },
					400,
				);
			}

			return c.json({
				success: true,
				message: "Document uploaded successfully",
				data: {
					documentId: result.documentId,
				},
			});
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Upload failed"),
			);
			return c.json(
				{ success: false, error: "Upload failed" },
				500,
			);
		}
	})
	// GET /api/lost-documents - List user's documents
	.get("/", async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json({ success: false, error: "Unauthorized" }, 401);
		}

		try {
			const documents = await lostDocumentRepository.getByUserId(session.userId);

			return c.json({
				success: true,
				data: documents.map((doc) => ({
					id: doc.id,
					documentType: doc.documentType,
					extractedCity: doc.extractedCity,
					blurredImageUrl: doc.blurredImageUrl,
					createdAt: doc.createdAt,
				})),
			});
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Fetch failed"),
			);
			return c.json(
				{ success: false, error: "Fetch failed" },
				500,
			);
		}
	})
	// GET /api/lost-documents/matches - Get matches for user
	.get("/matches", async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json({ success: false, error: "Unauthorized" }, 401);
		}

		try {
			// Get all user's documents with matches above threshold
			const userDocuments = await lostDocumentRepository.getByUserId(session.userId);
			const allMatches: any[] = [];

			for (const doc of userDocuments) {
				const matches = await lostDocumentRepository.getMatchesWithUserInfo(doc.id);
				allMatches.push(
					...matches.map((m) => ({
						matchId: m.id,
						documentId: m.documentId,
						matchScore: m.compositeScore,
						potentialOwner: {
							id: m.potentialOwner.id,
							name: m.potentialOwner.name,
							email: m.potentialOwner.email,
						},
						nameMatch: m.nameMatch,
						birthYearMatch: m.birthYearMatch,
						cityMatch: m.cityMatch,
					})),
				);
			}

			return c.json({
				success: true,
				data: allMatches,
			});
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Fetch failed"),
			);
			return c.json(
				{ success: false, error: "Fetch failed" },
				500,
			);
		}
	})
	// GET /api/lost-documents/:id - Get document details
	.get("/:id", async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json({ success: false, error: "Unauthorized" }, 401);
		}

		try {
			const documentId = c.req.param("id");
			const document = await lostDocumentRepository.getOne(documentId);

			if (!document) {
				return c.json(
					{ success: false, error: "Document not found" },
					404,
				);
			}

			// Check permissions
			const user = c.get("user");
			const isAdmin = user?.role === "admin";
			const isOwner = document.userId === session.userId;

			let imageUrl = document.blurredImageUrl;
			if (isAdmin || isOwner) {
				// Get signed URL for original
				imageUrl = (await lostDocumentService.getDocumentForOwner(
					documentId,
					session.userId,
				)) || document.blurredImageUrl;
			}

			return c.json({
				success: true,
				data: {
					id: document.id,
					documentType: document.documentType,
					extractedFirstName: document.extractedFirstName,
					extractedName: document.extractedName,
					extractedBirthYear: document.extractedBirthYear,
					extractedCity: document.extractedCity,
					imageUrl,
					createdAt: document.createdAt,
				},
			});
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Fetch failed"),
			);
			return c.json(
				{ success: false, error: "Fetch failed" },
				500,
			);
		}
	})
	// DELETE /api/lost-documents/:id - Delete document
	.delete("/:id", async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json({ success: false, error: "Unauthorized" }, 401);
		}

		try {
			const documentId = c.req.param("id");
			const document = await lostDocumentRepository.getOne(documentId);

			if (!document) {
				return c.json(
					{ success: false, error: "Document not found" },
					404,
				);
			}

			// Check permissions
			const user = c.get("user");
			const isAdmin = user?.role === "admin";
			const isOwner = document.userId === session.userId;

			if (!isAdmin && !isOwner) {
				return c.json(
					{ success: false, error: "Forbidden" },
					403,
				);
			}

			const deleted = await lostDocumentRepository.delete(documentId);

			if (!deleted) {
				return c.json(
					{ success: false, error: "Failed to delete" },
					500,
				);
			}

			return c.json({
				success: true,
				message: "Document deleted successfully",
			});
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Delete failed"),
			);
			return c.json(
				{ success: false, error: "Delete failed" },
				500,
			);
		}
	});
