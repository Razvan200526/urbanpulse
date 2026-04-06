import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const sanitizeObjectName = (fileName: string) => {
	const normalizedName = fileName.trim().replace(/^.*[\\/]/, "");
	const extensionIndex = normalizedName.lastIndexOf(".");
	const baseName =
		extensionIndex > 0
			? normalizedName.slice(0, extensionIndex)
			: normalizedName;
	const extension =
		extensionIndex > 0 ? normalizedName.slice(extensionIndex).toLowerCase() : "";

	const safeBaseName =
		baseName
			.normalize("NFKD")
			.replace(/[^\w.-]+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "")
			.toLowerCase() || "file";

	const safeExtension = extension.replace(/[^.\w-]+/g, "");
	return `${safeBaseName}${safeExtension}`;
};

const encodeObjectKeyForUrl = (key: string) =>
	key
		.split("/")
		.map((segment, index) =>
			index === 0 ? segment : encodeURIComponent(segment),
		)
		.join("/");

/**
 * Singleton service that allows read/write pipeline for files to Cloudflare R2 storage.
 * These buckets are used to store user uploaded files and generate urls and storing them in the db
 */
export class StorageService {
	private readonly accessKey: string;
	private readonly secretKey: string;
	private readonly endpoint: string;
	private bucketName: string;
	private readonly S3Client: S3Client;

	constructor() {
		this.accessKey = Bun.env.R2_ACCESS_KEY;
		this.secretKey = Bun.env.R2_SECRET_ACCESS_KEY;
		this.endpoint = Bun.env.R2_ENDPOINT;
		this.bucketName = Bun.env.R2_BUCKET_NAME;
		this.S3Client = new S3Client({
			region: "auto",
			endpoint: this.endpoint,
			credentials: {
				accessKeyId: this.accessKey,
				secretAccessKey: this.secretKey,
			},
			forcePathStyle: true,
		});
	}

	getBucketName() {
		return this.bucketName;
	}

	setBucket(bucket: string) {
		this.bucketName = bucket;
	}

	getAvatarBucket() {
		return Bun.env.R2_DOMAIN;
	}

	getImageBucket() {
		return Bun.env.R2_DOMAIN;
	}

	private buildPublicUrl(key: string) {
		const bucketUrl = this.getImageBucket();
		const normalizedBucketUrl = bucketUrl.endsWith("/")
			? bucketUrl
			: `${bucketUrl}/`;

		return `${normalizedBucketUrl}${encodeObjectKeyForUrl(key)}`;
	}

	/**
	 *
	 * @param file
	 * Method for uploading an avatar to the S3 bucket
	 * The key is generated based on the current timestamp and the file name(also the folder it should go in inside the bucket)
	 * @returns The url of the uploaded avatar
	 */
	async uploadAvatar(file: File): Promise<string> {
		const key = `avatars/${Date.now()}-${sanitizeObjectName(file.name)}`;
		this.setBucket("urbanpulse");

		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: new Uint8Array(await file.arrayBuffer()),
			ContentType: file.type,
		});

		await this.S3Client.send(command);
		return this.buildPublicUrl(key);
	}

	/**
	 *
	 * @param file
	 * Method for uploading an image to the S3 bucket
	 * The key is generated based on the current timestamp and the file name(also the folder it should go in inside the bucket)
	 * @returns The url of the uploaded image
	 */
	async uploadImage(file: File): Promise<string> {
		const key = `images/${Date.now()}-${sanitizeObjectName(file.name)}`;
		this.setBucket("urbanpulse");

		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: new Uint8Array(await file.arrayBuffer()),
			ContentType: file.type,
		});

		await this.S3Client.send(command);
		return this.buildPublicUrl(key);
	}

	async uploadAudioFile(file: File): Promise<string> {
		const key = `audio/${Date.now()}-${sanitizeObjectName(file.name)}`;
		this.setBucket("urbanpulse");

		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: new Uint8Array(await file.arrayBuffer()),
			ContentType: file.type,
		});

		await this.S3Client.send(command);
		return this.buildPublicUrl(key);
	}
}

export const storageService = new StorageService();
