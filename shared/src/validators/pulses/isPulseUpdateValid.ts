import { PulseStatusEnum } from "@shared/types";
import * as z from "zod";

export const pulseIdParamSchema = z.object({
	id: z.string().uuid(),
});

export const pulseUpdateBodySchema = z
	.object({
		status: z.enum(PulseStatusEnum).optional(),
		isResolved: z.boolean().optional(),
	})
	.refine((d) => d.status !== undefined || d.isResolved !== undefined, {
		message: "At least one of status or isResolved is required",
	});

export type PulseUpdateBody = z.infer<typeof pulseUpdateBodySchema>;
