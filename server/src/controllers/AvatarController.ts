import { zValidator } from "@hono/zod-validator";
import { uploadService } from "@server/services/UploadService";
import { handleError } from "@server/utils/handleError";
import { fileUploadSchema } from "@shared/validators/upload/isFileUploadValid";
import { Hono } from "hono";

export const avatarController = new Hono()
	.basePath("/avatar")
	.post("/", zValidator("form", fileUploadSchema), async (c) => {
		try {
			const { file, type } = c.req.valid("form");

			const url = await uploadService.upload(file, type);
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
	});
