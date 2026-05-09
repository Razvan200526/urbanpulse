import {
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@server/utils/Logger";
import { LostDocumentTypeEnum } from "@shared/types";
import type { SensitiveRegionType } from "@shared/validators/lost-documents/isLostDocumentValid";
import Sharp from "sharp";

interface ProcessedDocument {
	originalKey: string;
	blurredUrl: string;
	blurredKey: string;
}

type RegionKind = NonNullable<SensitiveRegionType["kind"]>;
type MaskSource = "mandatory" | "ai";
type RomanianIdOrientation = "landscape" | "portrait-cw" | "portrait-ccw";

export interface AppliedMaskRegion {
	x: number;
	y: number;
	w: number;
	h: number;
	kind: RegionKind;
	source: MaskSource;
}

interface DebugMaskOverlay {
	overlayUrl: string;
	orientation: RomanianIdOrientation;
	appliedMasks: AppliedMaskRegion[];
}

interface TemplateRegion {
	x: number;
	y: number;
	w: number;
	h: number;
	kind: RegionKind;
}

interface RegionWithSource extends SensitiveRegionType {
	source: MaskSource;
}

interface MaskPlan {
	width: number;
	height: number;
	orientation: RomanianIdOrientation;
	mandatoryMasks: RegionWithSource[];
	aiMasks: RegionWithSource[];
}

const buildPublicAssetUrl = (domain: string, key: string) => {
	const normalizedDomain = domain.replace(/\/+$/, "");
	const normalizedKey = key.replace(/^\/+/, "");
	return `${normalizedDomain}/${normalizedKey}`;
};

const MIN_TEXT_REGION_SIZE = 24;
const REGION_PADDING_RATIO = 0.02;
const BLUR_INTENSITY = 32;
const MAX_AI_SINGLE_REGION_COVERAGE_RATIO = 0.14;
const MAX_AI_TOTAL_COVERAGE_RATIO = 0.28;
const MAX_FACE_OVERLAP_RATIO = 0.1;
const MAX_PROTECTED_ZONE_OVERLAP_RATIO = 0.5;
const AI_MIN_REGION_AREA = 150;

const ROMANIAN_ID_MANDATORY_TEMPLATES: TemplateRegion[] = [
	{
		x: 0.62,
		y: 0.17,
		w: 0.32,
		h: 0.11,
		kind: "SERIES_NUMBER",
	},
	{
		x: 0.52,
		y: 0.41,
		w: 0.42,
		h: 0.11,
		kind: "CNP",
	},
	{
		x: 0.45,
		y: 0.57,
		w: 0.5,
		h: 0.31,
		kind: "ADDRESS",
	},
];

const ROMANIAN_ID_PROTECTED_TEMPLATES: TemplateRegion[] = [
	{
		x: 0.03,
		y: 0.2,
		w: 0.31,
		h: 0.58,
		kind: "FACE",
	},
	{
		x: 0.34,
		y: 0.13,
		w: 0.35,
		h: 0.18,
		kind: "FACE",
	},
];

const getRegionPriority = (kind?: SensitiveRegionType["kind"]): number => {
	switch (kind) {
		case "CNP":
			return 100;
		case "SERIES_NUMBER":
			return 90;
		case "ADDRESS":
			return 80;
		case "MRZ":
			return 70;
		case "SENSITIVE_TEXT":
			return 60;
		default:
			return 10;
	}
};

/**
 * Service for processing and storing document images
 * Handles blurring of sensitive regions and uploading to R2
 */
export class DocumentImageService {
	private s3Client: any;
	private bucketName: string;
	private endpoint: string;
	private accessKey: string;
	private secretKey: string;

	constructor() {
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
		documentType?: LostDocumentTypeEnum,
	): Promise<ProcessedDocument> {
		try {
			const timestamp = Date.now();
			const randomSuffix = Math.random().toString(36).substring(7);
			const originalKey = `lost-documents/original/${timestamp}-${randomSuffix}.webp`;
			const blurredKey = `lost-documents/blurred/${timestamp}-${randomSuffix}.webp`;

			await this.uploadToPrivateBucket(imageBuffer, originalKey);
			logger.info(`Uploaded original document: ${originalKey}`);

			const processedBuffer = await this.blurSensitiveRegions(
				imageBuffer,
				sensitiveRegions,
				documentType,
			);

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
				error instanceof Error
					? error
					: new Error("Document processing failed"),
			);
			throw error;
		}
	}

	async createDebugMaskOverlay(
		originalKey: string,
		sensitiveRegions: SensitiveRegionType[],
		documentType?: LostDocumentTypeEnum,
	): Promise<DebugMaskOverlay> {
		const imageBuffer = await this.getPrivateObjectBuffer(originalKey);
		const maskPlan = await this.buildMaskPlan(
			imageBuffer,
			sensitiveRegions,
			documentType,
		);
		const allMasks = [...maskPlan.mandatoryMasks, ...maskPlan.aiMasks];
		const overlaySvg = this.createDebugOverlaySvg(
			maskPlan.width,
			maskPlan.height,
			allMasks,
		);
		const overlayBuffer = await Sharp(imageBuffer)
			.composite([{ input: Buffer.from(overlaySvg) }])
			.webp({ quality: 92 })
			.toBuffer();

		const timestamp = Date.now();
		const randomSuffix = Math.random().toString(36).substring(7);
		const overlayKey = `lost-documents/debug/${timestamp}-${randomSuffix}.webp`;
		await this.uploadToPrivateBucket(overlayBuffer, overlayKey);

		const overlayUrl = await this.getSignedUrl(overlayKey, 10 * 60);
		return {
			overlayUrl,
			orientation: maskPlan.orientation,
			appliedMasks: allMasks.map((mask) => ({
				x: mask.x,
				y: mask.y,
				w: mask.w,
				h: mask.h,
				kind: (mask.kind || "SENSITIVE_TEXT") as RegionKind,
				source: mask.source,
			})),
		};
	}

	private async blurSensitiveRegions(
		imageBuffer: Buffer,
		regions: SensitiveRegionType[],
		documentType?: LostDocumentTypeEnum,
	): Promise<Buffer> {
		try {
			const maskPlan = await this.buildMaskPlan(
				imageBuffer,
				regions,
				documentType,
			);
			const effectiveRegions = [
				...maskPlan.mandatoryMasks,
				...maskPlan.aiMasks,
			];
			if (effectiveRegions.length === 0) {
				return imageBuffer;
			}

			const overlays: Array<{ input: Buffer; top: number; left: number }> = [];
			for (const region of effectiveRegions) {
				const x = Math.max(
					0,
					Math.min(region.x, maskPlan.width - MIN_TEXT_REGION_SIZE),
				);
				const y = Math.max(
					0,
					Math.min(region.y, maskPlan.height - MIN_TEXT_REGION_SIZE),
				);
				const w = Math.max(
					MIN_TEXT_REGION_SIZE,
					Math.min(region.w, maskPlan.width - x),
				);
				const h = Math.max(
					MIN_TEXT_REGION_SIZE,
					Math.min(region.h, maskPlan.height - y),
				);

				const blurredRegion = await Sharp(imageBuffer)
					.extract({ left: x, top: y, width: w, height: h })
					.blur(BLUR_INTENSITY)
					.webp()
					.toBuffer();

				overlays.push({ input: blurredRegion, top: y, left: x });
			}

			const image = Sharp(imageBuffer);
			return await image.composite(overlays).webp({ quality: 90 }).toBuffer();
		} catch (error) {
			logger.exception(
				error instanceof Error ? error : new Error("Region blurring failed"),
			);
			throw error;
		}
	}

	private async buildMaskPlan(
		imageBuffer: Buffer,
		regions: SensitiveRegionType[],
		documentType?: LostDocumentTypeEnum,
	): Promise<MaskPlan> {
		const metadata = await Sharp(imageBuffer).metadata();
		const width = metadata.width || 800;
		const height = metadata.height || 600;
		const normalizedAiRegions = this.normalizeAndExpandRegions(
			regions,
			width,
			height,
		);

		if (documentType !== LostDocumentTypeEnum.IdCard) {
			return {
				width,
				height,
				orientation: "landscape",
				mandatoryMasks: [],
				aiMasks: this.sanitizeAiRegions(normalizedAiRegions, width, height, []),
			};
		}

		const orientation = this.resolveRomanianIdOrientation(
			normalizedAiRegions,
			width,
			height,
		);
		const mandatoryMasks = this.getMandatoryRomanianIdMasks(
			width,
			height,
			orientation,
		);
		const protectedZones = this.getProtectedRomanianIdZones(
			width,
			height,
			orientation,
		);
		const aiMasks = this.sanitizeAiRegions(
			normalizedAiRegions,
			width,
			height,
			protectedZones,
			mandatoryMasks,
		);

		return {
			width,
			height,
			orientation,
			mandatoryMasks,
			aiMasks,
		};
	}

	private normalizeAndExpandRegions(
		regions: SensitiveRegionType[],
		width: number,
		height: number,
	): SensitiveRegionType[] {
		const padding = Math.round(Math.min(width, height) * REGION_PADDING_RATIO);

		return regions
			.map((region) => {
				const usesNormalizedCoordinates =
					region.x >= 0 &&
					region.y >= 0 &&
					region.w > 0 &&
					region.h > 0 &&
					region.x <= 1 &&
					region.y <= 1 &&
					region.w <= 1 &&
					region.h <= 1;

				const baseX = usesNormalizedCoordinates
					? Math.round(region.x * width)
					: Math.round(region.x);
				const baseY = usesNormalizedCoordinates
					? Math.round(region.y * height)
					: Math.round(region.y);
				const baseW = usesNormalizedCoordinates
					? Math.round(region.w * width)
					: Math.round(region.w);
				const baseH = usesNormalizedCoordinates
					? Math.round(region.h * height)
					: Math.round(region.h);

				return {
					...region,
					x: Math.max(0, baseX - padding),
					y: Math.max(0, baseY - padding),
					w: baseW + padding * 2,
					h: baseH + padding * 2,
				};
			})
			.filter((region) => region.w > 1 && region.h > 1);
	}

	private resolveRomanianIdOrientation(
		aiRegions: SensitiveRegionType[],
		width: number,
		height: number,
	): RomanianIdOrientation {
		if (width >= height) {
			return "landscape";
		}

		const candidates: RomanianIdOrientation[] = ["portrait-cw", "portrait-ccw"];
		if (aiRegions.length === 0) {
			return "portrait-cw";
		}

		let best = "portrait-cw" as RomanianIdOrientation;
		let bestScore = -1;

		for (const candidate of candidates) {
			const masks = this.getMandatoryRomanianIdMasks(width, height, candidate);
			const score = this.computeMandatoryAiAlignmentScore(masks, aiRegions);
			if (score > bestScore) {
				bestScore = score;
				best = candidate;
			}
		}

		return best;
	}

	private computeMandatoryAiAlignmentScore(
		mandatoryMasks: RegionWithSource[],
		aiRegions: SensitiveRegionType[],
	): number {
		let score = 0;

		for (const mandatoryMask of mandatoryMasks) {
			let bestOverlap = 0;
			let bestKindBonus = 0;

			for (const aiRegion of aiRegions) {
				if ((aiRegion.kind || "SENSITIVE_TEXT") === "FACE") {
					continue;
				}
				const overlap = this.calculateOverlapRatio(mandatoryMask, aiRegion);
				if (overlap > bestOverlap) {
					bestOverlap = overlap;
					bestKindBonus =
						mandatoryMask.kind === aiRegion.kind ||
						aiRegion.kind === "SENSITIVE_TEXT"
							? 0.2
							: 0;
				}
			}

			score += bestOverlap + bestKindBonus;
		}

		return score;
	}

	private getMandatoryRomanianIdMasks(
		width: number,
		height: number,
		orientation: RomanianIdOrientation,
	): RegionWithSource[] {
		return ROMANIAN_ID_MANDATORY_TEMPLATES.map((template) => {
			const region = this.projectTemplateToImage(
				template,
				width,
				height,
				orientation,
			);
			return {
				...region,
				source: "mandatory",
			};
		});
	}

	private getProtectedRomanianIdZones(
		width: number,
		height: number,
		orientation: RomanianIdOrientation,
	): SensitiveRegionType[] {
		return ROMANIAN_ID_PROTECTED_TEMPLATES.map((template) =>
			this.projectTemplateToImage(template, width, height, orientation),
		);
	}

	private projectTemplateToImage(
		template: TemplateRegion,
		width: number,
		height: number,
		orientation: RomanianIdOrientation,
	): SensitiveRegionType {
		if (orientation === "portrait-cw") {
			return this.normalizedToPixels(
				{
					x: 1 - (template.y + template.h),
					y: template.x,
					w: template.h,
					h: template.w,
					kind: template.kind,
				},
				width,
				height,
			);
		}

		if (orientation === "portrait-ccw") {
			return this.normalizedToPixels(
				{
					x: template.y,
					y: 1 - (template.x + template.w),
					w: template.h,
					h: template.w,
					kind: template.kind,
				},
				width,
				height,
			);
		}

		return this.normalizedToPixels(template, width, height);
	}

	private normalizedToPixels(
		template: TemplateRegion,
		width: number,
		height: number,
	): SensitiveRegionType {
		return {
			x: Math.round(template.x * width),
			y: Math.round(template.y * height),
			w: Math.max(MIN_TEXT_REGION_SIZE, Math.round(template.w * width)),
			h: Math.max(MIN_TEXT_REGION_SIZE, Math.round(template.h * height)),
			kind: template.kind,
		};
	}

	private sanitizeAiRegions(
		aiRegions: SensitiveRegionType[],
		width: number,
		height: number,
		protectedZones: SensitiveRegionType[],
		mandatoryMasks: SensitiveRegionType[] = [],
	): RegionWithSource[] {
		const totalImageArea = Math.max(1, width * height);
		const faceZones = aiRegions.filter((region) => region.kind === "FACE");
		const selected: RegionWithSource[] = [];
		let runningCoverage = 0;

		const candidates = aiRegions
			.filter((region) => {
				const kind = (region.kind || "SENSITIVE_TEXT") as RegionKind;
				if (kind === "FACE") {
					return false;
				}

				const clamped = this.clampRegion(region, width, height);
				if (clamped.w * clamped.h < AI_MIN_REGION_AREA) {
					return false;
				}

				const areaRatio = (clamped.w * clamped.h) / totalImageArea;
				if (areaRatio > MAX_AI_SINGLE_REGION_COVERAGE_RATIO) {
					return false;
				}

				const overlapsFace = faceZones.some(
					(faceRegion) =>
						this.calculateOverlapRatio(clamped, faceRegion) >
						MAX_FACE_OVERLAP_RATIO,
				);
				if (overlapsFace) {
					return false;
				}

				const overlapsProtectedZone = protectedZones.some(
					(zone) =>
						this.calculateOverlapRatio(clamped, zone) >
						MAX_PROTECTED_ZONE_OVERLAP_RATIO,
				);
				if (overlapsProtectedZone) {
					return false;
				}

				const coveredByMandatory = mandatoryMasks.some(
					(mandatoryMask) =>
						this.calculateOverlapRatio(clamped, mandatoryMask) > 0.96,
				);
				if (coveredByMandatory) {
					return false;
				}

				return true;
			})
			.map((region) => this.clampRegion(region, width, height))
			.sort((a, b) => {
				const priorityDiff =
					getRegionPriority(b.kind) - getRegionPriority(a.kind);
				if (priorityDiff !== 0) {
					return priorityDiff;
				}
				return a.w * a.h - b.w * b.h;
			});

		for (const candidate of candidates) {
			const coverage = (candidate.w * candidate.h) / totalImageArea;
			if (runningCoverage + coverage > MAX_AI_TOTAL_COVERAGE_RATIO) {
				continue;
			}

			const duplicatesExisting = selected.some(
				(existing) => this.calculateOverlapRatio(candidate, existing) > 0.9,
			);
			if (duplicatesExisting) {
				continue;
			}

			selected.push({ ...candidate, source: "ai" });
			runningCoverage += coverage;
		}

		return selected;
	}

	private clampRegion(
		region: SensitiveRegionType,
		width: number,
		height: number,
	): SensitiveRegionType {
		const x = Math.max(0, Math.min(Math.round(region.x), width - 1));
		const y = Math.max(0, Math.min(Math.round(region.y), height - 1));
		const w = Math.max(1, Math.min(Math.round(region.w), width - x));
		const h = Math.max(1, Math.min(Math.round(region.h), height - y));
		return {
			...region,
			x,
			y,
			w,
			h,
		};
	}

	private createDebugOverlaySvg(
		width: number,
		height: number,
		masks: RegionWithSource[],
	): string {
		const rectangles = masks
			.map((mask) => {
				const color = mask.source === "mandatory" ? "#ef4444" : "#f59e0b";
				const label = `${mask.source.toUpperCase()}:${mask.kind || "SENSITIVE_TEXT"}`;
				const fontSize = Math.max(
					12,
					Math.round(Math.min(width, height) * 0.016),
				);
				return [
					`<rect x="${mask.x}" y="${mask.y}" width="${mask.w}" height="${mask.h}" fill="none" stroke="${color}" stroke-width="3" />`,
					`<rect x="${mask.x}" y="${Math.max(0, mask.y - fontSize - 6)}" width="${Math.max(70, Math.min(mask.w, 220))}" height="${fontSize + 4}" fill="${color}" fill-opacity="0.82" />`,
					`<text x="${mask.x + 4}" y="${Math.max(fontSize, mask.y - 4)}" fill="#ffffff" font-size="${fontSize}" font-family="Arial, sans-serif">${label}</text>`,
				].join("");
			})
			.join("");

		return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${rectangles}</svg>`;
	}

	private calculateOverlapRatio(
		first: SensitiveRegionType,
		second: SensitiveRegionType,
	): number {
		const left = Math.max(first.x, second.x);
		const top = Math.max(first.y, second.y);
		const right = Math.min(first.x + first.w, second.x + second.w);
		const bottom = Math.min(first.y + first.h, second.y + second.h);
		if (right <= left || bottom <= top) {
			return 0;
		}

		const overlapArea = (right - left) * (bottom - top);
		const firstArea = Math.max(1, first.w * first.h);
		return overlapArea / firstArea;
	}

	private async getPrivateObjectBuffer(key: string): Promise<Buffer> {
		const command = new GetObjectCommand({
			Bucket: this.bucketName,
			Key: key,
		});
		const response = await this.s3Client.send(command);
		if (!response.Body) {
			throw new Error(`Missing object body for key ${key}`);
		}
		const bytes = await response.Body.transformToByteArray();
		return Buffer.from(bytes);
	}

	private async uploadToPrivateBucket(
		buffer: Buffer,
		key: string,
	): Promise<void> {
		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: buffer,
			ContentType: "image/webp",
		});

		await this.s3Client.send(command);
	}

	private async uploadToPublicBucket(
		buffer: Buffer,
		key: string,
	): Promise<string> {
		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: buffer,
			ContentType: "image/webp",
			ACL: "public-read",
		});

		await this.s3Client.send(command);

		const domain =
			Bun.env.R2_DOMAIN ||
			`https://${this.bucketName}.r2.cloudflarestorage.com`;
		return buildPublicAssetUrl(domain, key);
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
