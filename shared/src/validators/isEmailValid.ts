import * as z from "zod";

export const emailSchema = z.object({
	email: z.email(),
});

export const isEmailValid = (email: string) => {
	return emailSchema.safeParse({ email }).success;
};
