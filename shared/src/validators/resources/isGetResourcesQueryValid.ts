import * as z from "zod";

export const getResourcesSchema = z.object({
	userId: z.string(),
	// long: z.string(),
	// lat: z.string(),
});

export const isGetResourcesQueryValid = (query: unknown) => {
	return getResourcesSchema.safeParse(query);
};
