import * as z from "zod";

export const deleteResourceSchema = z.object({
	resourceId: z.string(),
});
