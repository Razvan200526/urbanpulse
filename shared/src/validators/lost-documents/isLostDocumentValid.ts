import * as z from "zod";
import { LostDocumentTypeEnum } from "@shared/types";

export const lostDocumentUploadSchema = z.object({
	documentType: z.enum([
		LostDocumentTypeEnum.IdCard,
		LostDocumentTypeEnum.Passport,
		LostDocumentTypeEnum.DrivingLicense,
		LostDocumentTypeEnum.StudentCard,
		LostDocumentTypeEnum.HealthCard,
		LostDocumentTypeEnum.Other,
	]),
});

export const sensitiveRegionSchema = z.object({
	x: z.number().min(0),
	y: z.number().min(0),
	w: z.number().min(1),
	h: z.number().min(1),
});

export const documentAnalysisSchema = z.object({
	documentType: z.string(),
	extractedName: z.string().optional().nullable(),
	extractedFirstName: z.string().optional().nullable(),
	extractedBirthYear: z.number().optional().nullable(),
	extractedCity: z.string().optional().nullable(),
	sensitiveRegions: z.array(sensitiveRegionSchema),
	alreadyBlurred: z.boolean(),
});

export type LostDocumentUploadType = z.infer<typeof lostDocumentUploadSchema>;
export type SensitiveRegionType = z.infer<typeof sensitiveRegionSchema>;
export type DocumentAnalysisType = z.infer<typeof documentAnalysisSchema>;
