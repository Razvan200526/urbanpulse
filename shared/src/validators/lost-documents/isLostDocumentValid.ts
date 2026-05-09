import { LostDocumentTypeEnum } from "@shared/types";
import * as z from "zod";

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
	kind: z
		.enum(["SENSITIVE_TEXT", "FACE", "CNP", "SERIES_NUMBER", "ADDRESS", "MRZ"])
		.optional(),
});

export const documentAnalysisSchema = z.object({
	documentType: z.nativeEnum(LostDocumentTypeEnum),
	extractedName: z.string().nullable().optional(),
	extractedFirstName: z.string().nullable().optional(),
	extractedBirthYear: z.number().nullable().optional(),
	extractedCity: z.string().nullable().optional(),
	sensitiveRegions: z.array(sensitiveRegionSchema),
	faceRegionDetected: z.boolean().optional().default(false),
	alreadyBlurred: z.boolean(),
});

export type LostDocumentUploadType = z.infer<typeof lostDocumentUploadSchema>;
export type SensitiveRegionType = z.infer<typeof sensitiveRegionSchema>;
export type DocumentAnalysisType = z.infer<typeof documentAnalysisSchema>;
