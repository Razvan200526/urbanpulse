import * as z from "zod";

export const nameSchema = z.string().min(1).max(100);

export const isNameValid = (name: unknown) => {
	return nameSchema.safeParse(name).success;
};
