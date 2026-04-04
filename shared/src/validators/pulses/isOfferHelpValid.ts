import { createSafePlainTextSchema } from "@shared/validators/createSafePlainTextSchema";
import * as z from "zod";

export const offerHelpBodySchema = z.object({
	note: createSafePlainTextSchema(0, 500, {
		allowEmpty: true,
	})
		.optional()
		.default(""),
});

export type OfferHelpBody = z.infer<typeof offerHelpBodySchema>;
