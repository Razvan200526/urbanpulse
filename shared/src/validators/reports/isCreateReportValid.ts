import * as z from "zod";

export const createReportSchema = z
	.object({
		reason: z.string().trim().min(5).max(500),
		targetUserId: z.string().min(1).nullable().optional(),
		targetPulseId: z.string().uuid().nullable().optional(),
	})
	.refine(
		(data) => Boolean(data.targetUserId || data.targetPulseId),
		{
			message: "Either targetUserId or targetPulseId is required",
			path: ["targetPulseId"],
		},
	);

export type CreateReportType = z.infer<typeof createReportSchema>;
