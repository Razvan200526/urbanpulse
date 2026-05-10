import { lostDocumentRepository } from "@server/repositories/LostDocumentRepository";
import { documentImageService } from "@server/services/DocumentImageService";
import { documentMatchingService } from "@server/services/DocumentMatchingService";
import { lostDocumentAIService } from "@server/services/LostDocumentAIService";
import { logger } from "@server/utils/Logger";
import { LostDocumentEmbeddingStatusEnum } from "@shared/types";

const MAX_DOCUMENTS_PER_USER = 3;

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

	/**
	 * Upload and process a lost document
	 * @param userId User ID
	 * @param imageBuffer Document image buffer
	 * @returns Upload result with document ID
	 */
	async uploadDocument(
		userId: string,
		imageBuffer: Buffer,
	): Promise<UploadResult> {
		try {
			const count = await this.repo.countByUserId(userId);
			if (count >= MAX_DOCUMENTS_PER_USER) {
				return {
					success: false,
					error: `Maximum ${MAX_DOCUMENTS_PER_USER} documents per user reached`,
				};
			}

			const { originalKey, blurredUrl, blurredBuffer } =
				await this.imageService.processDocument(imageBuffer);

			const analysis = await this.aiService.analyzeDocument(blurredBuffer);
			if (!analysis) {
				return {
					success: false,
					error: "Failed to analyze document",
				};
			}

			const embeddingText = this.buildEmbeddingText(
				analysis.extractedFirstName,
				analysis.extractedName,
				analysis.extractedBirthYear,
				analysis.extractedCity,
			);

			const embedding = await this.aiService.generateEmbedding(embeddingText);

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
				embeddingStatus: embedding
					? LostDocumentEmbeddingStatusEnum.Ready
					: LostDocumentEmbeddingStatusEnum.Failed,
				embeddingUpdatedAt: embedding ? new Date() : undefined,
				sensitiveRegions: [],
			});

			if (!document) {
				return {
					success: false,
					error: "Failed to save document",
				};
			}

			documentMatchingService.matchDocument(document.id).catch((err) => {
				logger.exception(
					err instanceof Error ? err : new Error("Matching failed"),
				);
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
	 * List public feed documents (blurred previews only)
	 */
	async getPublicFeed(userId: string) {
		return this.repo.getPublicFeed(userId);
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
}

export const lostDocumentService = new LostDocumentService();
