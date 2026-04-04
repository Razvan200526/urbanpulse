import { PulseEnum, PulseStatusEnum, UrgencyEnum } from "@shared/types";
import * as z from "zod";

export const retrievePulsePayloadSchema = z.object({
	position: z.object({
		x: z.number(),
		y: z.number(),
	}),
	radius: z.number().min(100).max(5000).optional(),
	type: z.nativeEnum(PulseEnum).optional(),
	urgency: z.nativeEnum(UrgencyEnum).optional(),
	status: z.nativeEnum(PulseStatusEnum).optional(),
	verifiedOnly: z.boolean().optional(),
});

export type PulseRetrievePayloadType = z.infer<
	typeof retrievePulsePayloadSchema
>;
