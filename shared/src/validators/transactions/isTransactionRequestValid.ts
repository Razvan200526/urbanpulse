import * as z from "zod";

export const transactionRequestSchema = z.object({
	borrowerId: z.string(),
	resourceId: z.string(),
});
