import * as z from "zod";

export const resourceSchema = z.object({
	userId: z.uuid(),
	name: z.string(),
	description: z.string(),
	availibility: z.enum(["Available", "Unavailable", "Currently Unavailable"]),
	createdAt: z.coerce.date(),
});

export type ResourceType = z.infer<typeof resourceSchema>;

export const isResourceValid = (resorceInfo: unknown) => {
	return resourceSchema.safeParse(resorceInfo);
};
