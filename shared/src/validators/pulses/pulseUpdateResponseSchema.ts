import * as z from "zod";

export const pulseUpdateResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	data: z.object({}),
});
