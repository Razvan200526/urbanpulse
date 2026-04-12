import * as z from "zod";
import { resourceItemSchema } from "./isResourceValid";

export const getResourcesSchema = z
	.object({
		filter: z.enum([
			"All",
			"Available",
			"Unavailable",
			"Currently Unavailable",
		]),
		excludeOwn: z.coerce.boolean().optional().default(false),
		lat: z.coerce.number().min(-90).max(90).optional(),
		long: z.coerce.number().min(-180).max(180).optional(),
		radiusMeters: z.coerce.number().int().min(100).max(10000).default(2000),
		type: resourceItemSchema.optional(),
	})
	.superRefine((query, ctx) => {
		if ((query.lat == null) !== (query.long == null)) {
			ctx.addIssue({
				code: "custom",
				message: "lat and long must be provided together",
				path: query.lat == null ? ["lat"] : ["long"],
			});
		}
	});

export type GetResourceQuery = z.infer<typeof getResourcesSchema>;

export const isGetResourcesQueryValid = (query: unknown) => {
	return getResourcesSchema.safeParse(query);
};

export const getOneResourceSchema = z.object({
	resourceId: z.string(),
});
