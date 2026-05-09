import { BaseAIService } from "@server/services/BaseAIService";
import type { DocumentAnalysisType } from "@shared/validators/lost-documents/isLostDocumentValid";
import { logger } from "@server/utils/Logger";

/**
 * Service for AI-powered lost document analysis and embedding generation
 */
export class LostDocumentAIService extends BaseAIService {
	private embeddingModel = "text-embedding-004";

	/**
	 * Analyzes a document image to extract information and identify sensitive regions
	 * @param imageBuffer Buffer containing the image
	 * @returns Document analysis with extracted data and sensitive regions
	 */
	async analyzeDocument(imageBuffer: Buffer): Promise<DocumentAnalysisType | null> {
		try {
			const base64Image = imageBuffer.toString("base64");
			const mimeType = "image/webp";

			const prompt = `Analyze this document image and extract the following information:
1. Document type (ID_CARD, PASSPORT, DRIVING_LICENSE, STUDENT_CARD, HEALTH_CARD, OTHER)
2. Extracted full name
3. Extracted first name
4. Extracted birth year (format: YYYY)
5. Extracted city/location
6. Identify sensitive regions that should be blurred (coordinates as x, y, width, height in pixels)
7. Whether the document is already blurred

Return a JSON object with these fields:
{
  "documentType": "ID_CARD",
  "extractedName": "John Doe",
  "extractedFirstName": "John",
  "extractedBirthYear": 1990,
  "extractedCity": "Bucharest",
  "sensitiveRegions": [
    {"x": 10, "y": 50, "w": 200, "h": 30},
    {"x": 220, "y": 50, "w": 200, "h": 30}
  ],
  "alreadyBlurred": false
}

Focus on identifying CNP number, series, and identification numbers as sensitive regions.`;

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
							{
								text: prompt,
							},
							{
								inlineData: {
									mimeType,
									data: base64Image,
								},
							},
						],
					},
				],
				config: {
					responseMimeType: "application/json",
				},
			});

			const text = response.text?.trim();
			if (!text) {
				logger.error("Empty response from Gemini");
				return null;
			}

			const analysis = JSON.parse(text) as DocumentAnalysisType;
			logger.info(`Document analyzed: ${analysis.documentType}`);
			return analysis;
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Document analysis failed"),
			);
			return null;
		}
	}

	/**
	 * Generates a 768-dimensional embedding for document text
	 * @param text Concatenated text (firstName lastName birthYear city)
	 * @returns 768-dimensional vector or null
	 */
	async generateEmbedding(text: string): Promise<number[] | null> {
		try {
			if (!text.trim()) {
				logger.error("Empty text provided for embedding");
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
					parts: [
						{
							text,
						},
					],
				},
			});

			const embeddings = (response as any).embedding?.values;
			if (!embeddings || embeddings.length !== 768) {
				logger.error(
					`Invalid embedding dimensions: ${embeddings?.length || 0}`,
				);
				return null;
			}

			logger.info(`Generated embedding for text: "${text.substring(0, 50)}..."`);
			return embeddings;
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Embedding generation failed"),
			);
			return null;
		}
	}
}

export const lostDocumentAIService = new LostDocumentAIService();
