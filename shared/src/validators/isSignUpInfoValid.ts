import { PASSWORD_REGEX } from "@shared/utils/constants";
import * as z from "zod";

export const signUpSchema = z.object({
	email: z.email(),
	name: z.string(),
	password: z.string().min(8).regex(PASSWORD_REGEX),
	image: z.url(),
	bio: z.string().min(0).max(100),
});

export type SignUpInfoType = z.infer<typeof signUpSchema>;

export const isSignUpInfoValid = (signUpInfo: SignUpInfoType) => {
	console.log(signUpInfo);
	return signUpSchema.safeParse(signUpInfo).success;
};
