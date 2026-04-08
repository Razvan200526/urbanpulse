import { PulseStatusEnum } from "@shared/types";
import { createSafePlainTextSchema } from "@shared/validators/createSafePlainTextSchema";
import * as z from "zod";

export const moderatePulseParamsSchema = z.object({
	id: z.string().uuid(),
});

export const moderatePulseSchema = z
	.object({
		status: z.nativeEnum(PulseStatusEnum).optional(),
		isVerified: z.boolean().optional(),
		moderationNote: createSafePlainTextSchema(0, 500, {
			allowEmpty: true,
		})
			.optional()
			.default(""),
	})
	.refine(
		(data) =>
			data.status !== undefined ||
			data.isVerified !== undefined ||
			Boolean(data.moderationNote),
		{
			message: "At least one moderation change is required",
		},
	);

export type ModeratePulseType = z.infer<typeof moderatePulseSchema>;
