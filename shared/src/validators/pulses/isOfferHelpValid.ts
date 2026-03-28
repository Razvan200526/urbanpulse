import * as z from "zod";

export const offerHelpBodySchema = z.object({
	note: z.string().max(500).trim().optional().default(""),
});

export type OfferHelpBody = z.infer<typeof offerHelpBodySchema>;
