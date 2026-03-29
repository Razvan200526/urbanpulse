import { PulseEnum } from "@shared/types";
import * as z from "zod";

/**
 * Schema used for validating pulse data before broadcasting it to nearby users in BroadcastService
 */
export const pulseDataSchema = z.object({
	position: z.object({
		x: z.number(),
		y: z.number(),
	}),
	type: z.enum([PulseEnum.Emergency, PulseEnum.Item, PulseEnum.Skill]),
	description: z.string().optional(),
	id: z.string(),
});

export const isPulseDataValid = (data: unknown) => {
	return pulseDataSchema.safeParse(data);
};
