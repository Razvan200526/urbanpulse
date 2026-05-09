import { z } from "zod";

export const retrieveSafetyCheckinsQuerySchema = z.object({
	lat: z.coerce.number().min(-90).max(90),
	lng: z.coerce.number().min(-180).max(180),
	radius: z.coerce.number().min(100).max(50000).optional().default(5000),
});

export type RetrieveSafetyCheckinsQueryType = z.infer<
	typeof retrieveSafetyCheckinsQuerySchema
>;
