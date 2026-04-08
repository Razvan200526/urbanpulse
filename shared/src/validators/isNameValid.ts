import { createSafePlainTextSchema } from "@shared/validators/createSafePlainTextSchema";

export const nameSchema = createSafePlainTextSchema(1, 100);

export const isNameValid = (name: unknown) => {
	return nameSchema.safeParse(name).success;
};
