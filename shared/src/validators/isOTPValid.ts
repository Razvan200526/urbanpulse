import { z } from "zod";

export const otpSchema = z
	.string()
	.length(6)
	.regex(/^\d{6}$/);

export const isOTPValid = (code: unknown) => {
	return otpSchema.safeParse(code).success;
};
