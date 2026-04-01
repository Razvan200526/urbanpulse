import * as z from "zod";

export const getResourcesSchema = z.object({
	filter: z.enum(["All", "Available", "Unavailable", "Currently Unavailable"]),
});

export const isGetResourcesQueryValid = (query: unknown) => {
	return getResourcesSchema.safeParse(query);
};

export const getOneResourceSchema = z.object({
	resourceId: z.string(),
});
