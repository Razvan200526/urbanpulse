import * as z from "zod";

export const bioSchema = z.string().min(0).max(100);

export const isBioValid = (bio: unknown) => {
	return bioSchema.safeParse(bio).success;
};
