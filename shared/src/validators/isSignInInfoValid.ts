import * as z from "zod";

export const signInSchema = z.object({
	email: z.email(),
	password: z.string(),
});

export type SignInInfoType = z.infer<typeof signInSchema>;

export const isSignInInfoValid = (info: unknown): info is SignInInfoType => {
	return signInSchema.safeParse(info).success;
};
