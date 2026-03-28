import * as z from "zod";

export const fileUploadSchema = z.object({
	file: z.custom<File>((val) => val instanceof Blob),
});
