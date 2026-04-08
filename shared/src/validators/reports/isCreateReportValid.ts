import { createSafePlainTextSchema } from "@shared/validators/createSafePlainTextSchema";
import * as z from "zod";

export const createReportSchema = z
	.object({
		reason: createSafePlainTextSchema(5, 500),
		targetUserId: z.string().min(1).nullable().optional(),
		targetPulseId: z.string().uuid().nullable().optional(),
	})
	.refine((data) => Boolean(data.targetUserId || data.targetPulseId), {
		message: "Either targetUserId or targetPulseId is required",
		path: ["targetPulseId"],
	});

export type CreateReportType = z.infer<typeof createReportSchema>;
