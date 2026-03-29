import { storageService } from "./S3Service";

export class UploadService {
	async upload(
		file: File,
		type: "avatar" | "image" | "audio",
	): Promise<string> {
		let url: string;
		switch (type) {
			case "avatar":
				url = await storageService.uploadAvatar(file);
				break;
			case "image":
				url = await storageService.uploadImage(file);
				break;
			case "audio":
				url = await storageService.uploadAudioFile(file);
				break;
			default:
				throw new Error("Invalid file type");
		}
		return url;
	}
}

export const uploadService = new UploadService();
