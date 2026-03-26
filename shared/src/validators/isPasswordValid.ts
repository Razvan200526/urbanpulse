import { PASSWORD_REGEX } from "@shared/utils/constants";
import * as z from "zod";

export const passwordSchema = z.string().min(6).regex(PASSWORD_REGEX);

export const isPasswordValid = (password: string) => {
	return passwordSchema.safeParse(password).success;
};
