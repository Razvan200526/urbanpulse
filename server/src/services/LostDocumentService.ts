import type { LostDocumentType, UserType } from "@server/db/schema";
import { lostDocumentRepository } from "@server/repositories/LostDocumentRepository";
import { userRepository } from "@server/repositories/UserRepository";
import {
	type AppliedMaskRegion,
	documentImageService,
} from "@server/services/DocumentImageService";
import { lostDocumentAIService } from "@server/services/LostDocumentAIService";
import { notificationService } from "@server/services/NotificationService";
import { logger } from "@server/utils/Logger";
import {
	LostDocumentEmbeddingStatusEnum,
	LostDocumentTypeEnum,
} from "@shared/types";

const MAX_DOCUMENTS_PER_USER = 3;
const MATCHING_THRESHOLD = 0.62;

const SCORE_WEIGHTS = {
	embedding: 0.35,
	name: 0.25,
	birthYear: 0.15,
	city: 0.1,
	documentType: 0.07,
	faceRegionPresence: 0.03,
	visibleFieldSimilarity: 0.05,
} as const;

type CandidateSignal = {
	similarityScore: number;
	nameScore: number;
	nameMatch: boolean;
	birthYearMatch: boolean;
	cityMatch: boolean;
	documentTypeScore: number;
	faceRegionScore: number;
	visibleFieldSimilarity: number;
	compositeScore: number;
};

interface UploadResult {
	success: boolean;
	documentId?: string;
	error?: string;
}

export interface AdminDebugMaskResult {
	overlayUrl: string;
	orientation: "landscape" | "portrait-cw" | "portrait-ccw";
	appliedMasks: AppliedMaskRegion[];
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
	async uploadDocument(
		userId: string,
		imageBuffer: Buffer,
	): Promise<UploadResult> {
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
			const { originalKey, blurredUrl } =
				await this.imageService.processDocument(
					imageBuffer,
					analysis.sensitiveRegions,
					analysis.documentType,
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
				embeddingStatus: embedding
					? LostDocumentEmbeddingStatusEnum.Ready
					: LostDocumentEmbeddingStatusEnum.Failed,
				embeddingUpdatedAt: embedding ? new Date() : undefined,
				sensitiveRegions: analysis.sensitiveRegions,
			});

			if (!document) {
				return {
					success: false,
					error: "Failed to save document",
				};
			}

			this.matchDocument(document.id).catch((err) => {
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
	 * Find matches for a document
	 * @param documentId Document ID
	 */
	async matchDocument(documentId: string): Promise<void> {
		try {
			const document = await this.repo.getOne(documentId);
			if (!document) {
				logger.error(`Document ${documentId} not found`);
				return;
			}

			const similarDocuments = document.embeddingVector
				? await this.repo.findSimilarByEmbedding(
						document.embeddingVector,
						0.2,
						100,
						document.id,
					)
				: [];
			const similarDocsByUser = this.groupDocumentsByUser(similarDocuments);
			const users = await this.userRepository.getAll();

			for (const user of users) {
				if (user.id === document.userId) {
					continue;
				}

				const candidateSignal = this.calculateCandidateSignal(
					document,
					user,
					similarDocsByUser.get(user.id) ?? [],
				);
				if (!this.isCandidateStrongEnough(candidateSignal)) {
					continue;
				}

				if (candidateSignal.compositeScore < MATCHING_THRESHOLD) {
					continue;
				}

				const existing = await this.repo.getExistingMatch(documentId, user.id);
				if (existing) {
					continue;
				}

				const match = await this.repo.createMatch({
					documentId,
					potentialOwnerId: user.id,
					similarityScore: candidateSignal.similarityScore,
					compositeScore: candidateSignal.compositeScore,
					nameMatch: candidateSignal.nameMatch,
					birthYearMatch: candidateSignal.birthYearMatch,
					cityMatch: candidateSignal.cityMatch,
				});

				if (match) {
					logger.info(
						`Created match between document ${documentId} and user ${user.id} (${Math.round(
							candidateSignal.compositeScore * 100,
						)}%)`,
					);
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
	 * Generate admin-only debug overlay with applied mask metadata.
	 */
	async getDebugMaskForAdmin(
		documentId: string,
	): Promise<AdminDebugMaskResult | null> {
		try {
			const document = await this.repo.getOne(documentId);
			if (!document) {
				return null;
			}

			return await this.imageService.createDebugMaskOverlay(
				document.originalImageKey,
				document.sensitiveRegions ?? [],
				document.documentType as any,
			);
		} catch (error) {
			logger.exception(
				error instanceof Error
					? error
					: new Error("Failed to generate debug mask overlay"),
			);
			return null;
		}
	}

	/**
	 * List public feed documents (blurred previews only)
	 */
	async getPublicFeed(userId: string): Promise<LostDocumentType[]> {
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

	private groupDocumentsByUser(
		documents: Array<LostDocumentType & { similarity: number }>,
	): Map<string, Array<LostDocumentType & { similarity: number }>> {
		const grouped = new Map<
			string,
			Array<LostDocumentType & { similarity: number }>
		>();
		for (const document of documents) {
			const existing = grouped.get(document.userId) ?? [];
			existing.push(document);
			grouped.set(document.userId, existing);
		}
		return grouped;
	}

	private calculateCandidateSignal(
		document: LostDocumentType,
		user: UserType,
		similarDocs: Array<LostDocumentType & { similarity: number }>,
	): CandidateSignal {
		const similarityScore = this.getHighestSimilarity(similarDocs);
		const nameScore = this.calculateNameScore(document, user);
		const nameMatch = nameScore >= 0.5;
		const birthYearMatch = this.isBirthYearMatch(document, user);
		const cityMatch = this.isCityMatch(document, user);
		const documentTypeScore = this.calculateDocumentTypeScore(
			document,
			similarDocs,
		);
		const faceRegionScore = this.calculateFaceRegionScore(
			document,
			similarDocs,
		);
		const visibleFieldSimilarity = this.calculateVisibleFieldSimilarity(
			document,
			{
				nameScore,
				birthYearMatch,
				cityMatch,
				documentTypeScore,
			},
		);

		const compositeScore =
			SCORE_WEIGHTS.embedding * similarityScore +
			SCORE_WEIGHTS.name * nameScore +
			SCORE_WEIGHTS.birthYear * Number(birthYearMatch) +
			SCORE_WEIGHTS.city * Number(cityMatch) +
			SCORE_WEIGHTS.documentType * documentTypeScore +
			SCORE_WEIGHTS.faceRegionPresence * faceRegionScore +
			SCORE_WEIGHTS.visibleFieldSimilarity * visibleFieldSimilarity;

		return {
			similarityScore,
			nameScore,
			nameMatch,
			birthYearMatch,
			cityMatch,
			documentTypeScore,
			faceRegionScore,
			visibleFieldSimilarity,
			compositeScore: Math.max(0, Math.min(1, compositeScore)),
		};
	}

	private isCandidateStrongEnough(signal: CandidateSignal): boolean {
		return (
			signal.similarityScore >= 0.22 ||
			signal.nameScore >= 0.45 ||
			signal.birthYearMatch ||
			signal.cityMatch
		);
	}

	private getHighestSimilarity(
		documents: Array<LostDocumentType & { similarity: number }>,
	): number {
		if (documents.length === 0) {
			return 0;
		}

		return documents.reduce(
			(highest, item) => Math.max(highest, Number(item.similarity) || 0),
			0,
		);
	}

	private calculateNameScore(
		document: LostDocumentType,
		user: UserType,
	): number {
		const firstName = this.normalizeToken(document.extractedFirstName);
		const extractedName = this.normalizeToken(document.extractedName);
		const userTokens = this.extractUserNameTokens(user);
		if (userTokens.length === 0) {
			return 0;
		}

		const userInitials = this.extractInitials(userTokens);
		const docNameParts = extractedName.split(" ").filter(Boolean);
		const lastNameFragment = this.getLastSignificantPart(docNameParts);

		const firstNameScore = this.matchFragmentScore(firstName, userTokens);
		const lastNameScore = this.matchFragmentScore(lastNameFragment, userTokens);
		const docInitials = this.extractInitials(
			[firstName, lastNameFragment].filter(Boolean),
		);
		const initialsMatch =
			docInitials.length > 0 && userInitials.startsWith(docInitials) ? 1 : 0;

		return Math.min(
			1,
			firstNameScore * 0.4 + lastNameScore * 0.4 + initialsMatch * 0.2,
		);
	}

	private extractUserNameTokens(user: UserType): string[] {
		const parts = [
			this.normalizeToken(user.firstName),
			this.normalizeToken(user.lastName),
			this.normalizeToken(user.name),
		]
			.join(" ")
			.split(" ")
			.filter(Boolean);
		return [...new Set(parts)];
	}

	private extractInitials(tokens: string[]): string {
		return tokens
			.filter((token) => token.length > 0)
			.map((token) => token[0])
			.join("");
	}

	private matchFragmentScore(fragment: string, userTokens: string[]): number {
		if (fragment.length < 2) {
			return 0;
		}

		const normalizedFragment = fragment.toLowerCase();
		return userTokens.some((token) => {
			const value = token.toLowerCase();
			return (
				value.includes(normalizedFragment) ||
				normalizedFragment.includes(value) ||
				value.startsWith(normalizedFragment.slice(0, 3))
			);
		})
			? 1
			: 0;
	}

	private getLastSignificantPart(parts: string[]): string {
		for (let index = parts.length - 1; index >= 0; index -= 1) {
			const part = parts[index];
			if (part && part.length > 1) {
				return part;
			}
		}
		return "";
	}

	private isBirthYearMatch(
		document: LostDocumentType,
		user: UserType,
	): boolean {
		return (
			typeof document.extractedBirthYear === "number" &&
			typeof user.birthYear === "number" &&
			document.extractedBirthYear === user.birthYear
		);
	}

	private isCityMatch(document: LostDocumentType, user: UserType): boolean {
		const extractedCity = this.normalizeToken(document.extractedCity);
		const homeCity = this.normalizeToken(user.homeCity);
		if (!extractedCity || !homeCity) {
			return false;
		}
		return (
			extractedCity === homeCity ||
			extractedCity.includes(homeCity) ||
			homeCity.includes(extractedCity)
		);
	}

	private calculateDocumentTypeScore(
		document: LostDocumentType,
		similarDocs: Array<LostDocumentType>,
	): number {
		if (similarDocs.length === 0) {
			return 0.4;
		}
		return similarDocs.some(
			(item) => item.documentType === document.documentType,
		)
			? 1
			: 0;
	}

	private calculateFaceRegionScore(
		document: LostDocumentType,
		similarDocs: Array<LostDocumentType>,
	): number {
		const currentHasFace = this.documentHasFaceRegion(document);
		if (!currentHasFace) {
			return 0.5;
		}

		if (similarDocs.length === 0) {
			return 0.3;
		}

		return similarDocs.some((item) => this.documentHasFaceRegion(item)) ? 1 : 0;
	}

	private documentHasFaceRegion(document: LostDocumentType): boolean {
		const regions = Array.isArray(document.sensitiveRegions)
			? document.sensitiveRegions
			: [];
		const hasFaceRegion = regions.some((region) => region?.kind === "FACE");
		if (hasFaceRegion) {
			return true;
		}

		return [
			LostDocumentTypeEnum.IdCard,
			LostDocumentTypeEnum.Passport,
			LostDocumentTypeEnum.DrivingLicense,
			LostDocumentTypeEnum.StudentCard,
		].includes(document.documentType as LostDocumentTypeEnum);
	}

	private calculateVisibleFieldSimilarity(
		document: LostDocumentType,
		fields: {
			nameScore: number;
			birthYearMatch: boolean;
			cityMatch: boolean;
			documentTypeScore: number;
		},
	): number {
		const values: number[] = [];
		if (document.extractedFirstName || document.extractedName) {
			values.push(fields.nameScore);
		}
		if (document.extractedBirthYear) {
			values.push(Number(fields.birthYearMatch));
		}
		if (document.extractedCity) {
			values.push(Number(fields.cityMatch));
		}
		values.push(fields.documentTypeScore);

		if (values.length === 0) {
			return 0;
		}
		return values.reduce((sum, value) => sum + value, 0) / values.length;
	}

	private normalizeToken(value: string | null | undefined): string {
		return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
	}
}

export const lostDocumentService = new LostDocumentService();
