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

export const documentAnalysisSchema = z.object({
	documentType: z.nativeEnum(LostDocumentTypeEnum),
	extractedName: z.string().nullable().optional(),
	extractedFirstName: z.string().nullable().optional(),
	extractedBirthYear: z.number().nullable().optional(),
	extractedCity: z.string().nullable().optional(),
});

export type LostDocumentUploadType = z.infer<typeof lostDocumentUploadSchema>;
export type DocumentAnalysisType = z.infer<typeof documentAnalysisSchema>;
