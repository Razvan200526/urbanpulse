import * as z from "zod";

export const nameSchema = z.string().min(1).max(50);

export const isNameValid = (name: unknown) => {
	return nameSchema.safeParse(name).success;
};
