import { ApiError } from "@google/genai";
import { BaseAIService } from "@server/services/BaseAIService";
import { logger } from "@server/utils/Logger";
import { LostDocumentTypeEnum } from "@shared/types";
import {
	type DocumentAnalysisType,
	documentAnalysisSchema,
} from "@shared/validators/lost-documents/isLostDocumentValid";

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

	/**
	 * Analyze a document image and extract only minimal matching metadata + sensitive regions.
	 */
	async analyzeDocument(
		imageBuffer: Buffer,
	): Promise<DocumentAnalysisType | null> {
		try {
			const base64Image = imageBuffer.toString("base64");
			const mimeType = detectImageMimeType(imageBuffer);

			const prompt = `Analyze this document image and extract the requested information.

CRITICAL RULE: The face photo and the person's name (First and Last) MUST REMAIN VISIBLE. Do NOT include coordinates for the face or the name in sensitiveRegions.

Extract:
1. Document type (ID_CARD, PASSPORT, DRIVING_LICENSE, STUDENT_CARD, HEALTH_CARD, OTHER)
2. Extracted full name
3. Extracted first name
4. Extracted birth year (YYYY)
5. Extracted city/location
6. Detect if a face/photo region is visible (true/false)
7. Whether the document is already blurred (true/false)

SENSITIVE REGIONS:
Return only sensitive fields as x, y, w, h relative to original image.
Include Romanian ID sensitive fields: CNP(the 10 digit number in the top portion), series+number(e.g IZ , 6 digit number), domicile/address, issuing identifiers, MRZ (if present).
Do NOT include non-sensitive fields.

Use only kind values:
- CNP
- SERIES_NUMBER
- ADDRESS
- MRZ
- SENSITIVE_TEXT
- FACE

Return EXACTLY this JSON shape:
{
  "documentType": "${LostDocumentTypeEnum.IdCard}",
  "extractedName": "John Doe",
  "extractedFirstName": "John",
  "extractedBirthYear": 1990,
  "extractedCity": "Bucuresti",
  "faceRegionDetected": true,
  "alreadyBlurred": false,
  "sensitiveRegions": [
    {"x": 10, "y": 50, "w": 200, "h": 30, "kind": "CNP"},
    {"x": 220, "y": 50, "w": 150, "h": 30, "kind": "SERIES_NUMBER"},
    {"x": 10, "y": 150, "w": 300, "h": 60, "kind": "ADDRESS"}
  ]
}`;

			const client = this.getClient();
			if (!client) {
				logger.error("Gemini client not initialized");
				return null;
			}

			const response = await client.models.generateContent({
				model: this.model,
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
							faceRegionDetected: { type: "boolean" },
							alreadyBlurred: { type: "boolean" },
							sensitiveRegions: {
								type: "array",
								items: {
									type: "object",
									properties: {
										x: { type: "number" },
										y: { type: "number" },
										w: { type: "number" },
										h: { type: "number" },
										kind: {
											type: "string",
											enum: [
												"CNP",
												"SERIES_NUMBER",
												"ADDRESS",
												"MRZ",
												"SENSITIVE_TEXT",
												"FACE",
											],
										},
									},
									required: ["x", "y", "w", "h", "kind"],
								},
							},
						},
						required: ["documentType", "sensitiveRegions", "alreadyBlurred"],
					},
				},
			});

			const text = response.text?.trim();
			if (!text) {
				logger.error("Empty response from Gemini");
				return null;
			}

			const rawJson = JSON.parse(text);
			const parsed = documentAnalysisSchema.safeParse(rawJson);
			if (!parsed.success) {
				logger.error(
					`Zod validation error: ${JSON.stringify(parsed.error.format())}`,
				);
				return null;
			}

			const analysis = parsed.data as DocumentAnalysisType;
			analysis.faceRegionDetected =
				analysis.faceRegionDetected ||
				analysis.sensitiveRegions.some((region) => region.kind === "FACE");
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
