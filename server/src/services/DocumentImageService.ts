import Sharp from "sharp";
import type { SensitiveRegionType } from "@shared/validators/lost-documents/isLostDocumentValid";
import { StorageService, storageService } from "@server/services/S3Service";
import { logger } from "@server/utils/Logger";
import { PutObjectCommand, S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";

interface ProcessedDocument {
	originalKey: string;
	blurredUrl: string;
	blurredKey: string;
}

/**
 * Service for processing and storing document images
 * Handles blurring of sensitive regions and uploading to R2
 */
export class DocumentImageService {
	private storageService: StorageService;
	private s3Client: any;
	private bucketName: string;
	private endpoint: string;
	private accessKey: string;
	private secretKey: string;

	constructor() {
		this.storageService = storageService;
		this.bucketName = Bun.env.R2_BUCKET_NAME || "urbanpulse";
		this.endpoint = Bun.env.R2_ENDPOINT || "";
		this.accessKey = Bun.env.R2_ACCESS_KEY || "";
		this.secretKey = Bun.env.R2_SECRET_ACCESS_KEY || "";

		this.s3Client = new S3Client({
			region: "auto",
			endpoint: this.endpoint,
			credentials: {
				accessKeyId: this.accessKey,
				secretAccessKey: this.secretKey,
			},
			forcePathStyle: true,
		});
	}

	/**
	 * Process a document image: blur sensitive regions and upload both versions
	 * @param imageBuffer Original image buffer
	 * @param sensitiveRegions Regions to blur
	 * @returns Object with original key and blurred URL
	 */
	async processDocument(
		imageBuffer: Buffer,
		sensitiveRegions: SensitiveRegionType[],
	): Promise<ProcessedDocument> {
		try {
			// Generate unique keys for storage
			const timestamp = Date.now();
			const randomSuffix = Math.random().toString(36).substring(7);
			const originalKey = `lost-documents/original/${timestamp}-${randomSuffix}.webp`;
			const blurredKey = `lost-documents/blurred/${timestamp}-${randomSuffix}.webp`;

			// Upload original to private bucket
			await this.uploadToPrivateBucket(imageBuffer, originalKey);
			logger.info(`Uploaded original document: ${originalKey}`);

			// Blur sensitive regions and upload public version
			let processedBuffer: Buffer;
			if (sensitiveRegions.length > 0) {
				processedBuffer = await this.blurSensitiveRegions(
					imageBuffer,
					sensitiveRegions,
				);
			} else {
				processedBuffer = imageBuffer;
			}

			const blurredUrl = await this.uploadToPublicBucket(
				processedBuffer,
				blurredKey,
			);
			logger.info(`Uploaded blurred document: ${blurredKey}`);

			return {
				originalKey,
				blurredUrl,
				blurredKey,
			};
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Document processing failed"),
			);
			throw error;
		}
	}

	/**
	 * Apply blur to sensitive regions of an image
	 * @param imageBuffer Original image
	 * @param regions Regions to blur
	 * @returns Processed image buffer
	 */
	private async blurSensitiveRegions(
		imageBuffer: Buffer,
		regions: SensitiveRegionType[],
	): Promise<Buffer> {
		try {
			let image = Sharp(imageBuffer);

			// Get image metadata
			const metadata = await image.metadata();
			const width = metadata.width || 800;
			const height = metadata.height || 600;

			// Create blur layers for each region
			const overlays: Array<{ input: Buffer; top: number; left: number }> =
				[];

			for (const region of regions) {
				// Clamp region coordinates to image bounds
				const x = Math.max(0, Math.min(region.x, width - 1));
				const y = Math.max(0, Math.min(region.y, height - 1));
				const w = Math.min(region.w, width - x);
				const h = Math.min(region.h, height - y);

				// Extract region, blur it, and prepare for overlay
				const blurredRegion = await Sharp(imageBuffer)
					.extract({ left: x, top: y, width: w, height: h })
					.blur(10)
					.webp()
					.toBuffer();

				overlays.push({
					input: blurredRegion,
					top: y,
					left: x,
				});
			}

			// Apply all overlays
			if (overlays.length > 0) {
				image = image.composite(overlays);
			}

			return await image.webp({ quality: 90 }).toBuffer();
		} catch (error) {
			logger.exception(
				error instanceof Error
					? error
					: new Error("Region blurring failed"),
			);
			throw error;
		}
	}

	/**
	 * Upload image to private bucket (original)
	 * @param buffer Image buffer
	 * @param key S3 key
	 */
	private async uploadToPrivateBucket(buffer: Buffer, key: string): Promise<void> {
		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: buffer,
			ContentType: "image/webp",
		});

		await this.s3Client.send(command);
	}

	/**
	 * Upload image to public bucket (blurred)
	 * @param buffer Image buffer
	 * @param key S3 key
	 * @returns Public URL
	 */
	private async uploadToPublicBucket(buffer: Buffer, key: string): Promise<string> {
		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: buffer,
			ContentType: "image/webp",
			ACL: "public-read",
		});

		await this.s3Client.send(command);

		// Build public URL
		const domain = Bun.env.R2_DOMAIN || `https://${this.bucketName}.r2.cloudflarestorage.com`;
		return `${domain}/${key}`;
	}

	/**
	 * Get signed URL for private document access
	 * @param key S3 key
	 * @param expirationSeconds URL expiration time
	 * @returns Signed URL
	 */
	async getSignedUrl(key: string, expirationSeconds = 3600): Promise<string> {
		try {
			const command = new GetObjectCommand({
				Bucket: this.bucketName,
				Key: key,
			});

			const url = await getS3SignedUrl(this.s3Client as any, command as any, {
				expiresIn: expirationSeconds,
			});

			return url;
		} catch (error) {
			logger.exception(
				error instanceof Error
					? error
					: new Error("Failed to generate signed URL"),
			);
			throw error;
		}
	}
}

export const documentImageService = new DocumentImageService();
