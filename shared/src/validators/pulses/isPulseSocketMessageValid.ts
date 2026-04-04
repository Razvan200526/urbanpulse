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

export const getMapPulsesSocketMessageSchema = z.object({
	type: z.literal("get-map-pulses"),
	payload: retrievePulsePayloadSchema,
});

export const pulseSocketMessageSchema = z.discriminatedUnion("type", [
	uploadPulseSocketMessageSchema,
	getPulsesSocketMessageSchema,
	getMapPulsesSocketMessageSchema,
]);

export type PulseSocketMessageType = z.infer<typeof pulseSocketMessageSchema>;
