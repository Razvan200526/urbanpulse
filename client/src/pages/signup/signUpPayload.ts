import type { SignUpDataType } from "./signUpStore";

export const buildSignUpPayload = (data: SignUpDataType): SignUpDataType => ({
	...data,
	bio: data.bio.trim(),
	image: data.image.trim(),
	name: data.name.trim(),
});
