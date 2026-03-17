import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";

const uploadSchema = z.object({
	file: z.custom<File>((val) => val instanceof Blob),
});

export const avatarController = new Hono()
	.post("/upload", zValidator("form", uploadSchema), async (c) => {
		const { file } = c.req.valid("form");
		if (!file) {
			return c.json(
				{ data: { success: false, message: "No file provided" } },
				400,
			);
		}
		return c.json(
			{ data: { success: true, message: "File uploaded successfully" } },
			200,
		);
	})
	.post("/upload/image", zValidator("form", uploadSchema), async (c) => {
		const { file } = c.req.valid("form");
		if (!file) {
			return c.json(
				{ data: { success: false, message: "No file provided" } },
				400,
			);
		}
		return c.json(
			{ data: { success: true, message: "File uploaded successfully" } },
			200,
		);
	});
