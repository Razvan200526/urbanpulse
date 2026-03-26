import * as z from "zod";

export const resourceSchema = z.object({
	userId: z.string(),
	name: z.string(),
	description: z.string(),
	availability: z.enum(["Available", "Unavailable", "Currently Unavailable"]),
	imageUrls: z.array(z.string()).optional().default([]),
});

export type ResourceType = z.infer<typeof resourceSchema>;

export const isCreateResourceReqValid = (resorceInfo: unknown) => {
	return resourceSchema.safeParse(resorceInfo);
};
