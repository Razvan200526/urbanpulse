import { ApiError } from "@google/genai";
import { BaseAIService } from "@server/services/BaseAIService";
import { logger } from "@server/utils/Logger";
import {
	type DocumentAnalysisType,
	documentAnalysisSchema,
} from "@shared/validators/lost-documents/isLostDocumentValid";
import { jsonrepair } from "jsonrepair";

const detectImageMimeType = (imageBuffer: Buffer): string => {
	if (
		imageBuffer.length >= 3 &&
		imageBuffer[0] === 0xff &&
		imageBuffer[1] === 0xd8 &&
		imageBuffer[2] === 0xff
	) {
		return "image/jpeg";
	}

	if (
		imageBuffer.length >= 8 &&
		imageBuffer[0] === 0x89 &&
		imageBuffer[1] === 0x50 &&
		imageBuffer[2] === 0x4e &&
		imageBuffer[3] === 0x47
	) {
		return "image/png";
	}

	if (
		imageBuffer.length >= 12 &&
		imageBuffer.subarray(0, 4).toString("ascii") === "RIFF" &&
		imageBuffer.subarray(8, 12).toString("ascii") === "WEBP"
	) {
		return "image/webp";
	}

	return "image/jpeg";
};

/**
 * Service for AI-powered lost document analysis and embedding generation
 */
export class LostDocumentAIService extends BaseAIService {
	private embeddingModel = "text-embedding-004";
	private extractionModel = "gemini-2.5-flash-lite";

	/**
	 * Analyze a document image and extract only minimal matching metadata + sensitive regions.
	 */
	async analyzeDocument(
		imageBuffer: Buffer,
	): Promise<DocumentAnalysisType | null> {
		try {
			const base64Image = imageBuffer.toString("base64");
			const mimeType = detectImageMimeType(imageBuffer);

			const prompt = `Extract visible identity-document text details from this image.

Return JSON with:
- documentType (ID_CARD, PASSPORT, DRIVING_LICENSE, STUDENT_CARD, HEALTH_CARD, OTHER)
- extractedName (full name if visible, else null)
- extractedFirstName (first name only if visible, else null)
- extractedBirthYear (number YYYY if visible, else null)
- extractedCity (city/location if visible, else null)

Rules:
- Use only text that is clearly visible.
- Do not invent missing values.
- If uncertain, return null for that field.`;

			const client = this.getClient();
			if (!client) {
				logger.error("Gemini client not initialized");
				return null;
			}

			const response = await client.models.generateContent({
				model: this.extractionModel,
				contents: [
					{
						role: "user",
						parts: [
							{ text: prompt },
							{ inlineData: { mimeType, data: base64Image } },
						],
					},
				],
				config: {
					responseMimeType: "application/json",
					responseJsonSchema: {
						type: "object",
						properties: {
							documentType: { type: "string" },
							extractedName: { type: "string", nullable: true },
							extractedFirstName: { type: "string", nullable: true },
							extractedBirthYear: { type: "number", nullable: true },
							extractedCity: { type: "string", nullable: true },
						},
						required: ["documentType"],
					},
				},
			});

			const text = response.text?.trim();
			if (!text) return null;

			const cleaned = text
				.replace(/^```json\s*/i, "")
				.replace(/```$/, "")
				.trim();

			let rawJson: unknown;
			try {
				rawJson = JSON.parse(cleaned);
			} catch {
				const repaired = jsonrepair(cleaned);
				rawJson = JSON.parse(repaired);
			}

			const parsed = documentAnalysisSchema.safeParse(rawJson);
			if (!parsed.success) {
				logger.error(
					`Zod validation error: ${JSON.stringify(parsed.error.format())}`,
				);
				return null;
			}

			const analysis = parsed.data as DocumentAnalysisType;
			return analysis;
		} catch (error) {
			if (error instanceof ApiError) {
				logger.exception(error);
			}
			logger.error(`${error}`);
			return null;
		}
	}

	/**
	 * Generate embedding vector for fuzzy matching.
	 */
	async generateEmbedding(text: string): Promise<number[] | null> {
		try {
			if (!text.trim()) {
				return null;
			}

			const client = this.getClient();
			if (!client) {
				logger.error("Gemini client not initialized");
				return null;
			}

			const response = await client.models.embedContent({
				model: this.embeddingModel,
				contents: {
					parts: [{ text }],
				},
			});

			const embeddings = response.embeddings?.[0]?.values;
			if (!embeddings || embeddings.length !== 768) {
				logger.error(
					`Invalid embedding dimensions: ${embeddings?.length || 0}`,
				);
				return null;
			}

			return embeddings;
		} catch (error) {
			logger.exception(
				error instanceof Error
					? error
					: new Error("Embedding generation failed"),
			);
			return null;
		}
	}
}

export const lostDocumentAIService = new LostDocumentAIService();
