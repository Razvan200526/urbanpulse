import { PulseStatusEnum, ReportStatusEnum } from "@shared/types";
import { createSafePlainTextSchema } from "@shared/validators/createSafePlainTextSchema";
import * as z from "zod";

export const reviewReportParamsSchema = z.object({
	id: z.string().uuid(),
});

export const reviewReportSchema = z.object({
	status: z.enum([ReportStatusEnum.Resolved, ReportStatusEnum.Dismissed]),
	pulseStatus: z.nativeEnum(PulseStatusEnum).optional(),
	pulseVerification: z.boolean().optional(),
	moderationNote: createSafePlainTextSchema(0, 500, {
		allowEmpty: true,
	})
		.optional()
		.default(""),
});

export type ReviewReportType = z.infer<typeof reviewReportSchema>;
