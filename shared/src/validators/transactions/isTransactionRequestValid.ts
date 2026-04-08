import { createSafePlainTextSchema } from "@shared/validators/createSafePlainTextSchema";
import * as z from "zod";

export const transactionRequestSchema = z.object({
	borrowerId: z.string(),
	resourceId: z.string(),
});

export const resourceReviewSchema = z.object({
	rating: z.number().int().min(1).max(5),
	comment: createSafePlainTextSchema(0, 500, { allowEmpty: true })
		.transform((value) => (value.length > 0 ? value : undefined))
		.optional(),
});

export type ResourceReviewPayload = z.infer<typeof resourceReviewSchema>;

export const isResourceReviewReqValid = (payload: unknown) => {
	return resourceReviewSchema.safeParse(payload);
};
