import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import {
	type GenerateContentResponse,
	GoogleGenAI,
	Modality,
} from "@google/genai";
import { logger } from "@server/utils/Logger";

interface ProcessedDocument {
	originalKey: string;
	blurredUrl: string;
	blurredKey: string;
	blurredBuffer: Buffer;
}

const IMAGE_EDIT_MODEL = "gemini-3.1-flash-image-preview";

const buildPublicAssetUrl = (domain: string, key: string) => {
	const normalizedDomain = domain.replace(/\/+$/, "");
	const normalizedKey = key.replace(/^\/+/, "");
	return `${normalizedDomain}/${normalizedKey}`;
};

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

const extractInlineImagePart = (
	response: GenerateContentResponse,
): string | undefined => {
	for (const candidate of response.candidates ?? []) {
		for (const part of candidate.content?.parts ?? []) {
			if (part.inlineData?.data) {
				return part.inlineData.data;
			}
		}
	}

	return undefined;
};

/**
 * Service for processing and storing document images.
 * Uses Nano Banana for prompt-based redaction without coordinate masks.
 */
export class DocumentImageService {
	private s3Client: S3Client;
	private bucketName: string;
	private aiClient: GoogleGenAI | null;

	constructor() {
		this.bucketName = Bun.env.R2_BUCKET_NAME || "urbanpulse";
		const endpoint = Bun.env.R2_ENDPOINT || "";
		const accessKey = Bun.env.R2_ACCESS_KEY || "";
		const secretKey = Bun.env.R2_SECRET_ACCESS_KEY || "";
		this.aiClient = Bun.env.GEMINI_API_KEY
			? new GoogleGenAI({ apiKey: Bun.env.GEMINI_API_KEY })
			: null;

		this.s3Client = new S3Client({
			region: "auto",
			endpoint,
			credentials: {
				accessKeyId: accessKey,
				secretAccessKey: secretKey,
			},
			forcePathStyle: true,
		});
	}

	async processDocument(imageBuffer: Buffer): Promise<ProcessedDocument> {
		try {
			const timestamp = Date.now();
			const randomSuffix = Math.random().toString(36).substring(7);
			const originalKey = `lost-documents/original/${timestamp}-${randomSuffix}.webp`;
			const blurredKey = `lost-documents/blurred/${timestamp}-${randomSuffix}.webp`;

			await this.uploadToPrivateBucket(imageBuffer, originalKey);

			const blurredBuffer =
				await this.blurSensitiveContentWithNanoBanana(imageBuffer);
			const blurredUrl = await this.uploadToPublicBucket(
				blurredBuffer,
				blurredKey,
			);
			return { originalKey, blurredUrl, blurredKey, blurredBuffer };
		} catch (error) {
			logger.exception(
				error instanceof Error
					? error
					: new Error("Document processing failed"),
			);
			throw error;
		}
	}

	private async blurSensitiveContentWithNanoBanana(
		imageBuffer: Buffer,
	): Promise<Buffer> {
		if (!this.aiClient) {
			logger.info(
				"Gemini API key missing; returning original image without edit",
			);
			return imageBuffer;
		}

		const prompt = `Edit this document image.
Blur or obscure sensitive fields such as personal numbers, series/number identifiers, address lines, issuing identifiers, and MRZ zones.
Keep the overall document layout unchanged.
Keep the portrait photo and non-sensitive text as readable as possible.
Do not crop, rotate, or restyle the image.`;

		try {
			const response = await this.aiClient.models.generateContent({
				model: IMAGE_EDIT_MODEL,
				contents: [
					{ text: prompt },
					{
						inlineData: {
							mimeType: detectImageMimeType(imageBuffer),
							data: imageBuffer.toString("base64"),
						},
					},
				],
				config: {
					responseModalities: [Modality.TEXT, Modality.IMAGE],
				},
			});

			const generatedImage = extractInlineImagePart(response);
			if (generatedImage) {
				return Buffer.from(generatedImage, "base64");
			}

			logger.info(
				`Nano Banana did not return an edited image; using original. model=${response.modelVersion || IMAGE_EDIT_MODEL} text=${JSON.stringify(response.text || "")} promptFeedback=${JSON.stringify(response.promptFeedback || null)}`,
			);
			return imageBuffer;
		} catch (error) {
			logger.exception(
				error instanceof Error
					? error
					: new Error("Nano Banana image editing failed"),
			);
			return imageBuffer;
		}
	}

	private async uploadToPrivateBucket(
		buffer: Buffer,
		key: string,
	): Promise<void> {
		await this.s3Client.send(
			new PutObjectCommand({
				Bucket: this.bucketName,
				Key: key,
				Body: buffer,
				ContentType: "image/webp",
			}),
		);
	}

	private async uploadToPublicBucket(
		buffer: Buffer,
		key: string,
	): Promise<string> {
		await this.s3Client.send(
			new PutObjectCommand({
				Bucket: this.bucketName,
				Key: key,
				Body: buffer,
				ContentType: "image/webp",
				ACL: "public-read",
			}),
		);

		const domain =
			Bun.env.R2_DOMAIN ||
			`https://${this.bucketName}.r2.cloudflarestorage.com`;
		return buildPublicAssetUrl(domain, key);
	}

	async getSignedUrl(key: string, expirationSeconds = 3600): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: this.bucketName,
			Key: key,
		});
		return await getS3SignedUrl(this.s3Client as any, command as any, {
			expiresIn: expirationSeconds,
		});
	}
}

export const documentImageService = new DocumentImageService();
