import * as z from "zod";
import { pulseRequestSchema } from "./isPulseRequestValid";
import { retrievePulsePayloadSchema } from "./isPulseRetrieveValid";

export const uploadPulseSocketMessageSchema = z.object({
	type: z.literal("upload-pulse"),
	payload: pulseRequestSchema,
});

export const getPulsesSocketMessageSchema = z.object({
	type: z.literal("get-pulses"),
	payload: retrievePulsePayloadSchema,
});

export const pulseSocketMessageSchema = z.discriminatedUnion("type", [
	uploadPulseSocketMessageSchema,
	getPulsesSocketMessageSchema,
]);

export type PulseSocketMessageType = z.infer<typeof pulseSocketMessageSchema>;
