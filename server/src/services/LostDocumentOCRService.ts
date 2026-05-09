import { ApiError } from "@google/genai";
import { BaseAIService } from "@server/services/BaseAIService";
import { logger } from "@server/utils/Logger";
import { z } from "zod";

export interface OcrTextBlock {
	text: string;
	x: number;
	y: number;
	w: number;
	h: number;
	confidence?: number;
}

interface OcrExtraction {
	blocks: OcrTextBlock[];
	alreadyBlurred: boolean;
	faceRegionDetected: boolean;
}

const ocrResponseSchema = z.object({
	alreadyBlurred: z.boolean().optional().default(false),
	faceRegionDetected: z.boolean().optional().default(false),
	blocks: z
		.array(
			z.object({
				text: z.string(),
				x: z.number(),
				y: z.number(),
				w: z.number(),
				h: z.number(),
				confidence: z.number().optional(),
			}),
		)
		.default([]),
});

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

export class LostDocumentOCRService extends BaseAIService {
	private ocrModel = "gemini-2.5-flash-lite";

	async extractTextBlocks(imageBuffer: Buffer): Promise<OcrExtraction | null> {
		try {
			const client = this.getClient();
			if (!client) {
				logger.error("Gemini client not initialized for OCR");
				return null;
			}

			const prompt = `Extract OCR text blocks from this document image.

Rules:
- Return line-level text blocks only.
- For each block return normalized coordinates in range [0..1]: x, y, w, h relative to full image.
- Preserve original casing for text.
- Do not invent text.
- If uncertain, skip the block.
- Detect whether a face/photo area is visible and if image appears already blurred.

Return JSON with:
{
  "alreadyBlurred": false,
  "faceRegionDetected": true,
  "blocks": [{"text":"...","x":0.1,"y":0.2,"w":0.3,"h":0.05,"confidence":0.9}]
}`;

			const response = await client.models.generateContent({
				model: this.ocrModel,
				contents: [
					{
						role: "user",
						parts: [
							{ text: prompt },
							{
								inlineData: {
									mimeType: detectImageMimeType(imageBuffer),
									data: imageBuffer.toString("base64"),
								},
							},
						],
					},
				],
				config: {
					responseMimeType: "application/json",
					maxOutputTokens: 4096,
				},
			});

			const text = response.text?.trim();
			if (!text) {
				return null;
			}

			const parsed = ocrResponseSchema.safeParse(JSON.parse(text));
			if (!parsed.success) {
				logger.error(
					`Invalid OCR response schema: ${JSON.stringify(parsed.error.format())}`,
				);
				return null;
			}

			const blocks = parsed.data.blocks
				.map((block) => ({
					...block,
					text: block.text.trim(),
					x: Math.max(0, Math.min(1, block.x)),
					y: Math.max(0, Math.min(1, block.y)),
					w: Math.max(0.001, Math.min(1, block.w)),
					h: Math.max(0.001, Math.min(1, block.h)),
				}))
				.filter((block) => block.text.length > 0)
				.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

			return {
				blocks,
				alreadyBlurred: parsed.data.alreadyBlurred,
				faceRegionDetected: parsed.data.faceRegionDetected,
			};
		} catch (error) {
			if (error instanceof ApiError) {
				logger.exception(error);
			}
			logger.error(`${error}`);
			return null;
		}
	}
}

export const lostDocumentOCRService = new LostDocumentOCRService();
