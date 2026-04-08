import { createSafePlainTextSchema } from "@shared/validators/createSafePlainTextSchema";
import * as z from "zod";

export const resourceSchema = z.object({
	userId: z.string(),
	name: createSafePlainTextSchema(1, 100),
	description: createSafePlainTextSchema(1, 500),
	availability: z.enum(["Available", "Unavailable", "Currently Unavailable"]),
	imageUrls: z.array(z.url()).max(6).optional().default([]),
});

export type ResourceType = z.infer<typeof resourceSchema>;

export const isCreateResourceReqValid = (resorceInfo: unknown) => {
	return resourceSchema.safeParse(resorceInfo);
};
