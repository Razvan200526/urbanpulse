import { PulseEnum, UrgencyEnum } from "@shared/types";
import { createSafePlainTextSchema } from "@shared/validators/createSafePlainTextSchema";
import * as z from "zod";

export const pulseRequestSchema = z.object({
	type: z.enum(PulseEnum).optional().default(PulseEnum.Emergency),
	urgency: z.enum(UrgencyEnum),
	title: createSafePlainTextSchema(1, 100),
	description: createSafePlainTextSchema(0, 500),
	position: z.object({
		x: z.number().min(-180).max(180),
		y: z.number().min(-90).max(90),
	}),
	imageUrls: z.array(z.url()).max(6).optional().default([]),
	audioUrl: z.preprocess(
		(value) =>
			typeof value === "string" && value.trim() === "" ? undefined : value,
		z.url().optional(),
	),
});

export const isPulseRequestValid = (data: unknown) => {
	const {
		error,
		success,
		data: pulseData,
	} = pulseRequestSchema.safeParse(data);
	return { error, success, pulseData };
};

export type PulseRequestType = z.infer<typeof pulseRequestSchema>;
