import type { LostDocumentType, UserType } from "@server/db/schema";
import { lostDocumentRepository } from "@server/repositories/LostDocumentRepository";
import { userRepository } from "@server/repositories/UserRepository";
import { messagingService } from "@server/services/MessagingService";
import { notificationService } from "@server/services/NotificationService";
import { notificationFactory } from "@server/shared/NotificationFactory";
import { logger } from "@server/utils/Logger";
import { LostDocumentTypeEnum } from "@shared/types";

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

export class DocumentMatchingService {
	private repo = lostDocumentRepository;
	private userRepo = userRepository;

	async rematchDocumentAsAdmin(params: {
		documentId: string;
		renotifyExisting?: boolean;
	}) {
		const document = await this.repo.getOne(params.documentId);
		if (!document) {
			return { success: false as const, error: "Document not found" };
		}

		let resetNotifiedCount = 0;
		if (params.renotifyExisting) {
			resetNotifiedCount = await this.repo.resetNotifiedMatches(
				params.documentId,
			);
		}

		await this.matchDocument(params.documentId);
		const matches = await this.repo.getMatchesWithUserInfo(
			params.documentId,
			0,
		);

		return {
			success: true as const,
			documentId: params.documentId,
			totalMatches: matches.length,
			resetNotifiedCount,
		};
	}

	async rematchAllDocumentsAsAdmin(params?: { renotifyExisting?: boolean }) {
		const documents = await this.repo.getAll();
		let rematchedCount = 0;
		let totalMatches = 0;
		let resetNotifiedCount = 0;

		for (const document of documents) {
			const result = await this.rematchDocumentAsAdmin({
				documentId: document.id,
				renotifyExisting: params?.renotifyExisting ?? false,
			});

			if (!result.success) {
				continue;
			}

			rematchedCount += 1;
			totalMatches += result.totalMatches;
			resetNotifiedCount += result.resetNotifiedCount;
		}

		return {
			success: true as const,
			processedDocuments: documents.length,
			rematchedCount,
			totalMatches,
			resetNotifiedCount,
		};
	}

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
			const users = await this.userRepo.getAll();

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

				const hasStrongIdentityMatch = this.hasStrongIdentityMatch(
					document,
					user,
					candidateSignal.nameScore,
				);

				if (
					candidateSignal.compositeScore < MATCHING_THRESHOLD &&
					!hasStrongIdentityMatch
				) {
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
						)}%, strongIdentity=${hasStrongIdentityMatch})`,
					);
				}
			}

			await this.notifyMatches(documentId);
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Matching failed"),
			);
		}
	}

	async openMatchConversation(params: {
		matchId: string;
		requesterUserId: string;
	}) {
		const match = await this.repo.getMatchById(params.matchId);
		if (!match) {
			return { success: false as const, error: "Match not found" };
		}

		const document = await this.repo.getOne(match.documentId);
		if (!document) {
			return { success: false as const, error: "Document not found" };
		}

		if (
			params.requesterUserId !== match.potentialOwnerId &&
			params.requesterUserId !== document.userId
		) {
			return { success: false as const, error: "Forbidden" };
		}

		const otherUserId =
			params.requesterUserId === match.potentialOwnerId
				? document.userId
				: match.potentialOwnerId;

		const conversation = await messagingService.ensureDirectConversation(
			params.requesterUserId,
			otherUserId,
		);
		if (!conversation) {
			return { success: false as const, error: "Failed to open chat" };
		}

		return {
			success: true as const,
			conversationId: conversation.id,
			counterpartUserId: otherUserId,
		};
	}

	private async notifyMatches(documentId: string): Promise<void> {
		const matches = await this.repo.getUnnotifiedMatches(documentId);
		if (matches.length === 0) {
			return;
		}

		const document = await this.repo.getOne(documentId);
		if (!document) {
			return;
		}

		const uploader = await this.userRepo.getOne(document.userId);
		const notifiedIds: string[] = [];

		for (const match of matches) {
			try {
				const payload = {
					matchId: match.id,
					documentId: document.id,
					documentType: document.documentType,
					matchScore: Math.round(match.compositeScore * 100),
					locationHint: document.extractedCity,
					uploaderUser: uploader
						? {
								id: uploader.id,
								name: uploader.name,
								email: uploader.email,
								image: uploader.image,
							}
						: {
								id: document.userId,
								name: "Document uploader",
								email: null,
								image: null,
							},
					conversationId: null,
				};

				await notificationService.notifyUsers(
					[match.potentialOwnerId],
					notificationFactory.create({
						type: "DOCUMENT_MATCH",
						payload,
						message:
							"A potential document match was found. Open chat to coordinate safely.",
					}),
				);

				notifiedIds.push(match.id);
			} catch (error) {
				logger.error(
					`Failed to notify user ${match.potentialOwnerId}: ${String(error)}`,
				);
			}
		}

		if (notifiedIds.length > 0) {
			await this.repo.markAsNotified(notifiedIds);
		}
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
		const fragmentScore = Math.min(
			1,
			firstNameScore * 0.4 + lastNameScore * 0.4 + initialsMatch * 0.2,
		);
		const fullNameTokenScore = this.calculateFullNameTokenScore(
			extractedName,
			userTokens,
		);

		return Math.max(fragmentScore, fullNameTokenScore);
	}

	private calculateFullNameTokenScore(
		extractedName: string,
		userTokens: string[],
	): number {
		if (!extractedName) {
			return 0;
		}

		const docTokens = extractedName
			.split(" ")
			.filter((token) => token.length > 1);
		if (docTokens.length === 0) {
			return 0;
		}

		const docTokenSet = new Set(docTokens);
		const matches = userTokens.filter((token) => docTokenSet.has(token)).length;
		const referenceSize = Math.max(1, Math.min(userTokens.length, 3));
		return Math.min(1, matches / referenceSize);
	}

	private hasStrongIdentityMatch(
		document: LostDocumentType,
		user: UserType,
		nameScore: number,
	): boolean {
		if (nameScore < 0.72) {
			return false;
		}

		const documentNameTokens = this.extractDocumentNameTokens(document);
		const userNameTokens = this.extractUserNameTokens(user);
		if (documentNameTokens.length === 0 || userNameTokens.length === 0) {
			return false;
		}

		const documentTokenSet = new Set(documentNameTokens);
		const matchedCount = userNameTokens.filter((token) =>
			documentTokenSet.has(token),
		).length;

		return matchedCount >= 2;
	}

	private extractDocumentNameTokens(document: LostDocumentType): string[] {
		const tokens = [
			this.normalizeToken(document.extractedFirstName),
			this.normalizeToken(document.extractedName),
		]
			.join(" ")
			.split(" ")
			.filter((token) => token.length > 1);

		return [...new Set(tokens)];
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
		return (value ?? "")
			.normalize("NFD")
			.replace(/\p{Diacritic}/gu, "")
			.toLowerCase()
			.replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
			.replace(/\s+/g, " ")
			.trim();
	}
}

export const documentMatchingService = new DocumentMatchingService();
