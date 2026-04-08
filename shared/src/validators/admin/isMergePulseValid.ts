import { createSafePlainTextSchema } from "@shared/validators/createSafePlainTextSchema";
import * as z from "zod";

export const mergePulseSchema = z
	.object({
		sourcePulseId: z.string().uuid(),
		targetPulseId: z.string().uuid(),
		reason: createSafePlainTextSchema(5, 500),
	})
	.refine((data) => data.sourcePulseId !== data.targetPulseId, {
		message: "Source and target pulses must be different",
		path: ["targetPulseId"],
	});

export type MergePulseType = z.infer<typeof mergePulseSchema>;
