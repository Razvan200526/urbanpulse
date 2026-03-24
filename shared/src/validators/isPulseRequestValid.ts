import { PulseEnum, UrgencyEnum } from "@shared/types";
import * as z from "zod";

export const pulseRequestSchema = z.object({
	type: z.enum(PulseEnum).optional().default(PulseEnum.Emergency),
	urgency: z.enum(UrgencyEnum),
	title: z.string().min(1).max(30).trim(),
	description: z.string().max(500).trim().optional().or(z.literal("")),
	position: z.object({
		lat: z.number().min(-90).max(90),
		lng: z.number().min(-180).max(180),
	}),
});

export const isPulseRequestValid = (data: unknown) => {
	const {
		error,
		success,
		data: pulseData,
	} = pulseRequestSchema.safeParse(data);
	return { error, success, pulseData };
};
