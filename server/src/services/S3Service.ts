import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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

	/**
	 *
	 * @param file
	 * Method for uploading an avatar to the S3 bucket
	 * The key is generated based on the current timestamp and the file name(also the folder it should go in inside the bucket)
	 * @returns The url of the uploaded avatar
	 */
	async uploadAvatar(file: File): Promise<string> {
		const key = `avatars/${Date.now()}-${file.name}`;
		this.setBucket("urbanpulse");

		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: new Uint8Array(await file.arrayBuffer()),
			ContentType: file.type,
		});

		await this.S3Client.send(command);
		const bucketUrl = this.getAvatarBucket();
		return `${bucketUrl}${key}`;
	}

	/**
	 *
	 * @param file
	 * Method for uploading an image to the S3 bucket
	 * The key is generated based on the current timestamp and the file name(also the folder it should go in inside the bucket)
	 * @returns The url of the uploaded image
	 */
	async uploadImage(file: File): Promise<string> {
		const key = `images/${Date.now()}-${file.name}`;
		this.setBucket("urbanpulse");

		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: new Uint8Array(await file.arrayBuffer()),
			ContentType: file.type,
		});

		await this.S3Client.send(command);
		const bucketUrl = this.getImageBucket();
		return `${bucketUrl}${key}`;
	}

	async uploadAudioFile(file: File): Promise<string> {
		const key = `audio/${Date.now()}-${file.name}`;
		this.setBucket("urbanpulse");

		const command = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			Body: new Uint8Array(await file.arrayBuffer()),
			ContentType: file.type,
		});

		await this.S3Client.send(command);
		const bucketUrl = this.getImageBucket();
		return `${bucketUrl}${key}`;
	}
}

export const storageService = new StorageService();
