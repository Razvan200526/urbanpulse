import { createSafePlainTextSchema } from "@shared/validators/createSafePlainTextSchema";
import * as z from "zod";

export const resourceItemSchema = z.enum(["Skill", "Item", "Location"]);

const geoPointSchema = z.object({
	x: z.number().min(-180).max(180),
	y: z.number().min(-90).max(90),
});

export const resourceSchema = z.object({
	name: createSafePlainTextSchema(1, 100),
	description: createSafePlainTextSchema(1, 500),
	availability: z.enum(["Available", "Unavailable", "Currently Unavailable"]),
	resourceType: resourceItemSchema,
	position: geoPointSchema,
	locationLabel: z.string().max(40).optional(),
	imageUrls: z.array(z.url()).max(6).optional().default([]),
});

export type CreateResourcePayload = z.infer<typeof resourceSchema>;

export const isCreateResourceReqValid = (resourceInfo: unknown) => {
	return resourceSchema.safeParse(resourceInfo);
};
