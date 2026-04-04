import { createSafePlainTextSchema } from "@shared/validators/createSafePlainTextSchema";

export const bioSchema = createSafePlainTextSchema(0, 100, {
	allowEmpty: true,
});

export const isBioValid = (bio: unknown) => {
	return bioSchema.safeParse(bio).success;
};
