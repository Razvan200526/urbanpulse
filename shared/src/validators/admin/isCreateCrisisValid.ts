import { GLOBAL_CRISIS_RADIUS_THRESHOLD_METERS } from "@shared/utils/crisis";
import { z } from "zod";

const localScopeSchema = z.object({
	scope: z.literal("local"),
	incidentTypeId: z.string().uuid(),
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	radius: z.number().int().min(100).max(50_000),
});

const globalScopeSchema = z.object({
	scope: z.literal("global"),
	incidentTypeId: z.string().uuid(),
	lat: z.number().min(-90).max(90).optional(),
	lng: z.number().min(-180).max(180).optional(),
	radius: z
		.number()
		.int()
		.min(GLOBAL_CRISIS_RADIUS_THRESHOLD_METERS)
		.optional(),
});

export const createCrisisSchema = z.union([
	localScopeSchema,
	globalScopeSchema,
]);

export type CreateCrisisType = z.infer<typeof createCrisisSchema>;
