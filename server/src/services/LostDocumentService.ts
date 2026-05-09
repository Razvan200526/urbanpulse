import type {
	LostDocumentType,
	LostDocumentMatchType,
} from "@server/db/schema";
import { lostDocumentRepository } from "@server/repositories/LostDocumentRepository";
import { lostDocumentAIService } from "@server/services/LostDocumentAIService";
import { documentImageService } from "@server/services/DocumentImageService";
import { notificationService } from "@server/services/NotificationService";
import { userRepository } from "@server/repositories/UserRepository";
import { logger } from "@server/utils/Logger";

const MAX_DOCUMENTS_PER_USER = 3;
const MATCHING_THRESHOLD = 0.75;
const EMBEDDING_SIMILARITY_WEIGHT = 0.6;
const BIRTH_YEAR_BONUS = 0.2;
const CITY_MATCH_BONUS = 0.15;
const DOCUMENT_TYPE_BONUS = 0.05;

interface UploadResult {
	success: boolean;
	documentId?: string;
	error?: string;
}

/**
 * Service for managing lost document uploads, analysis, and matching
 */
export class LostDocumentService {
	private repo = lostDocumentRepository;
	private aiService = lostDocumentAIService;
	private imageService = documentImageService;
	private notificationService = notificationService;
	private userRepository = userRepository;

	/**
	 * Upload and process a lost document
	 * @param userId User ID
	 * @param imageBuffer Document image buffer
	 * @returns Upload result with document ID
	 */
	async uploadDocument(userId: string, imageBuffer: Buffer): Promise<UploadResult> {
		try {
			// Check document limit
			const count = await this.repo.countByUserId(userId);
			if (count >= MAX_DOCUMENTS_PER_USER) {
				return {
					success: false,
					error: `Maximum ${MAX_DOCUMENTS_PER_USER} documents per user reached`,
				};
			}

			// Analyze document
			const analysis = await this.aiService.analyzeDocument(imageBuffer);
			if (!analysis) {
				return {
					success: false,
					error: "Failed to analyze document",
				};
			}

			// Process image (blur + upload)
			const { originalKey, blurredUrl } = await this.imageService.processDocument(
				imageBuffer,
				analysis.sensitiveRegions,
			);

			// Generate embedding
			const embeddingText = this.buildEmbeddingText(
				analysis.extractedFirstName,
				analysis.extractedName,
				analysis.extractedBirthYear,
				analysis.extractedCity,
			);

			const embedding = await this.aiService.generateEmbedding(embeddingText);

			// Save to database
			const document = await this.repo.create({
				userId,
				documentType: analysis.documentType as any,
				extractedName: analysis.extractedName,
				extractedFirstName: analysis.extractedFirstName,
				extractedBirthYear: analysis.extractedBirthYear,
				extractedCity: analysis.extractedCity,
				originalImageKey: originalKey,
				blurredImageUrl: blurredUrl,
				embeddingVector: embedding || undefined,
				embeddingModel: embedding ? "text-embedding-004" : undefined,
				embeddingStatus: embedding ? ("ready" as any) : ("failed" as any),
				embeddingUpdatedAt: embedding ? new Date() : undefined,
				sensitiveRegions: analysis.sensitiveRegions,
			});

			if (!document) {
				return {
					success: false,
					error: "Failed to save document",
				};
			}

			// Trigger async matching
			this.matchDocument(document.id).catch((err) => {
				logger.exception(err instanceof Error ? err : new Error("Matching failed"));
			});

			return {
				success: true,
				documentId: document.id,
			};
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Document upload failed"),
			);
			return {
				success: false,
				error: "Upload failed",
			};
		}
	}

	/**
	 * Find matches for a document
	 * @param documentId Document ID
	 */
	async matchDocument(documentId: string): Promise<void> {
		try {
			const document = await this.repo.getOne(documentId);
			if (!document || !document.embeddingVector) {
				logger.error(`Document ${documentId} not found or has no embedding`);
				return;
			}

			// Find similar documents by embedding
			const similarDocuments = await this.repo.findSimilarByEmbedding(
				document.embeddingVector as any,
				0.6, // Lower threshold for initial search
				50,
			);

			// Build set of unique user IDs to check
			const userIdsToCheck = new Set<string>();

			// Add users from similar documents
			for (const doc of similarDocuments) {
				if (doc.userId !== document.userId) {
					userIdsToCheck.add(doc.userId);
				}
			}

			// Also check users with matching name/birth year/city
			if (
				document.extractedFirstName ||
				document.extractedName ||
				document.extractedBirthYear ||
				document.extractedCity
			) {
				// Query users with matching criteria would go here if we had a dedicated search
				// For now, we rely on the embedding-based search
			}

			// Generate matches
			for (const userId of userIdsToCheck) {
				const user = await this.userRepository.getOne(userId);
				if (!user) continue;

				// Calculate composite score
				const compositeScore = this.calculateCompositeScore(document, user);

				if (compositeScore >= MATCHING_THRESHOLD) {
					// Check if match already exists
					const existing = await this.repo.getExistingMatch(documentId, userId);

					if (!existing) {
						// Create match
						const match = await this.repo.createMatch({
							documentId: documentId as any,
							potentialOwnerId: userId,
							similarityScore:
								similarDocuments.find((d) => d.userId === userId)?.similarity || 0,
							compositeScore,
							nameMatch: this.checkNameMatch(document, user),
							birthYearMatch: document.extractedBirthYear === user.birthYear,
							cityMatch:
								document.extractedCity?.toLowerCase() ===
								user.homeCity?.toLowerCase(),
						});

						if (match) {
							logger.info(
								`Created match between document ${documentId} and user ${userId}`,
							);
						}
					}
				}
			}

			// Notify users about matches
			await this.notifyMatches(documentId);
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Matching failed"),
			);
		}
	}

	/**
	 * Notify users about document matches
	 * @param documentId Document ID
	 */
	private async notifyMatches(documentId: string): Promise<void> {
		try {
			const matches = await this.repo.getUnnotifiedMatches(documentId);
			if (matches.length === 0) return;

			const document = await this.repo.getOne(documentId);
			if (!document) return;

			const notifyIds: string[] = [];

			for (const match of matches) {
				try {
					// Create notification
					await this.notificationService.createNotification({
						userId: match.potentialOwnerId,
						type: "DOCUMENT_MATCH",
						payload: {
							documentId: document.id,
							documentType: document.documentType,
							matchScore: Math.round(match.compositeScore * 100),
							locationHint: document.extractedCity,
						},
					});

					notifyIds.push(match.id);
				} catch (err) {
					logger.error(
						`Failed to notify user ${match.potentialOwnerId}: ${err}`,
					);
				}
			}

			// Mark as notified
			if (notifyIds.length > 0) {
				await this.repo.markAsNotified(notifyIds);
			}
		} catch (error) {
			logger.exception(
				error instanceof Error
					? error
					: new Error("Notification sending failed"),
			);
		}
	}

	/**
	 * Get document for admin (original image)
	 * @param documentId Document ID
	 * @returns Signed URL for original image
	 */
	async getDocumentForAdmin(documentId: string): Promise<string | null> {
		try {
			const document = await this.repo.getOne(documentId);
			if (!document) return null;

			return await this.imageService.getSignedUrl(document.originalImageKey);
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Failed to get signed URL"),
			);
			return null;
		}
	}

	/**
	 * Get document for owner (original image)
	 * @param documentId Document ID
	 * @param userId Requesting user ID
	 * @returns Signed URL for original image or null
	 */
	async getDocumentForOwner(
		documentId: string,
		userId: string,
	): Promise<string | null> {
		try {
			const document = await this.repo.getOne(documentId);
			if (!document || document.userId !== userId) return null;

			return await this.imageService.getSignedUrl(document.originalImageKey);
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Failed to get signed URL"),
			);
			return null;
		}
	}

	/**
	 * Build embedding text from extracted fields
	 */
	private buildEmbeddingText(
		firstName: string | null | undefined,
		name: string | null | undefined,
		birthYear: number | null | undefined,
		city: string | null | undefined,
	): string {
		const parts: string[] = [];
		if (firstName) parts.push(firstName);
		if (name) parts.push(name);
		if (birthYear) parts.push(birthYear.toString());
		if (city) parts.push(city);
		return parts.join(" ");
	}

	/**
	 * Check if names match
	 */
	private checkNameMatch(document: LostDocumentType, user: any): boolean {
		const docName = `${document.extractedFirstName || ""} ${document.extractedName || ""}`.toLowerCase().trim();
		const userName = `${user.firstName || ""} ${user.lastName || ""} ${user.name || ""}`.toLowerCase().trim();

		return docName.length > 0 && userName.includes(docName);
	}

	/**
	 * Calculate composite matching score
	 */
	private calculateCompositeScore(document: LostDocumentType, user: any): number {
		let score = 0;

		// Embedding similarity: 60% weight
		// (This would use actual similarity if we have it - for now using base)
		score += EMBEDDING_SIMILARITY_WEIGHT;

		// Birth year exact match: +20% bonus
		if (
			document.extractedBirthYear &&
			user.birthYear &&
			document.extractedBirthYear === user.birthYear
		) {
			score += BIRTH_YEAR_BONUS;
		}

		// City match: +15% bonus
		if (
			document.extractedCity &&
			user.homeCity &&
			document.extractedCity.toLowerCase() === user.homeCity.toLowerCase()
		) {
			score += CITY_MATCH_BONUS;
		}

		// Document type consistency: +5% bonus (if user profile has similar document type info)
		score += DOCUMENT_TYPE_BONUS;

		return Math.min(score, 1.0);
	}
}

export const lostDocumentService = new LostDocumentService();
