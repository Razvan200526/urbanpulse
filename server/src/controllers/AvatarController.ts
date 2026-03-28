import { zValidator } from "@hono/zod-validator";
import { storageService } from "@server/services/S3Service";
import { handleError } from "@server/utils/handleError";
import { Hono } from "hono";
import { fileUploadSchema } from "@shared/validators/upload/isFileUploadValid";

export const avatarController = new Hono()
	.basePath("/avatar")
	.post("/upload", zValidator("form", fileUploadSchema), async (c) => {
		try {
			const { file } = c.req.valid("form");

			const url = await storageService.uploadAvatar(file);
			return c.json(
				{ data: { url, success: true, message: "File uploaded successfully" } },
				200,
			);
		} catch (e) {
			handleError(e);
			return c.json(
				{
					data: {
						url: null,
						success: false,
						message: "Failed to upload avatar",
					},
				},
				500,
			);
		}
	})
	.post("/upload/image", zValidator("form", fileUploadSchema), async (c) => {
		try {
			const { file } = c.req.valid("form");
			const url = await storageService.uploadImage(file);
			return c.json(
				{ data: { url, success: true, message: "File uploaded successfully" } },
				200,
			);
		} catch (e) {
			handleError(e);
			return c.json(
				{
					data: {
						url: null,
						success: false,
						message: "Failed to upload image",
					},
				},
				500,
			);
		}
	});
