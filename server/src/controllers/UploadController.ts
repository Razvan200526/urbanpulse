import { zValidator } from "@hono/zod-validator";
import { storageService } from "@server/services/S3Service";
import { fileUploadSchema } from "@shared/validators/upload/isFileUploadValid";
import { Hono } from "hono";

export const uploadController = new Hono()
	.basePath("/upload")
	.post("/audio", zValidator("form", fileUploadSchema), async (c) => {
		const { file } = c.req.valid("form");

		const uploadedFileUrl = await storageService.uploadAudioFile(file);

		return c.json({
			success: true,
			message: "Audio file uploaded successfully",
			data: {
				url: uploadedFileUrl,
			},
		});
	});
