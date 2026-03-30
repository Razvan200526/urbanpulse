import { PulseStatusEnum, ReportStatusEnum } from "@shared/types";
import * as z from "zod";

export const reviewReportParamsSchema = z.object({
	id: z.string().uuid(),
});

export const reviewReportSchema = z.object({
	status: z.enum([ReportStatusEnum.Resolved, ReportStatusEnum.Dismissed]),
	pulseStatus: z.nativeEnum(PulseStatusEnum).optional(),
});

export type ReviewReportType = z.infer<typeof reviewReportSchema>;
