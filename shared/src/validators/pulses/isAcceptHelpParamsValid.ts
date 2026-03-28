import * as z from "zod";

export const acceptHelpParamsSchema = z.object({
	id: z.string().uuid(),
	responseId: z.string().uuid(),
});
