import { bioSchema } from "@shared/validators/isBioValid";
import { PASSWORD_REGEX } from "@shared/utils/constants";
import * as z from "zod";

export const signUpNameSchema = z.string().trim().min(1).max(100);
export const signUpImageSchema = z.union([z.literal(""), z.url()]);

export const signUpSchema = z.object({
	email: z.email(),
	name: signUpNameSchema,
	password: z.string().min(8).regex(PASSWORD_REGEX),
	image: signUpImageSchema,
	bio: bioSchema,
});

export type SignUpInfoType = z.infer<typeof signUpSchema>;

export const isSignUpInfoValid = (signUpInfo: SignUpInfoType) => {
	return signUpSchema.safeParse(signUpInfo).success;
};
