import * as z from "zod";

const emailSchema = z.object({
	email: z.email(),
});

export const isEmailValid = (email: string) => {
	return emailSchema.safeParse({ email }).success;
};
