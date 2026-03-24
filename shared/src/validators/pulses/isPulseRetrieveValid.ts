import * as z from "zod";

export const retrievePulsePayloadSchema = z.object({
	userId: z.string(),
	position: z.object({
		x: z.number(),
		y: z.number(),
	}),
});

export type PulseRetrievePayloadType = z.infer<
	typeof retrievePulsePayloadSchema
>;
