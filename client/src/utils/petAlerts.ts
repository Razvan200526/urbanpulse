import {
	PetAlertEmbeddingStatusEnum,
	PetAlertTypeEnum,
	PetAlertUploadStatusEnum,
	UrgencyEnum,
} from "@shared/types";
import { z } from "zod";

const apiErrorSchema = z.object({
	detail: z.string(),
});

export const createApiEnvelopeSchema = <TSchema extends z.ZodTypeAny>(
	dataSchema: TSchema,
) =>
	z.object({
		success: z.literal(true),
		message: z.string(),
		data: dataSchema,
	});

export const throwPetAlertApiError = (
	value: unknown,
	fallbackMessage: string,
): never => {
	const parsedError = apiErrorSchema.safeParse(value);
	if (parsedError.success) {
		throw new Error(parsedError.data.detail);
	}

	throw new Error(fallbackMessage);
};

export const petAlertSchema = z.object({
	id: z.string().uuid(),
	pulseId: z.string().uuid(),
	alertType: z.nativeEnum(PetAlertTypeEnum),
	petType: z.string(),
	color: z.string(),
	breed: z.string().nullable(),
	imageUrl: z.string().nullable(),
	aiDescriptor: z.string().nullable(),
	embeddingStatus: z.nativeEnum(PetAlertEmbeddingStatusEnum),
	embeddingModel: z.string().nullable(),
	embeddingUpdatedAt: z.string().nullable(),
});

export const petAlertUploadAcceptedSchema = z.object({
	requestId: z.string().uuid(),
	alertId: z.string().uuid(),
	status: z.nativeEnum(PetAlertUploadStatusEnum),
	embeddingStatus: z.nativeEnum(PetAlertEmbeddingStatusEnum),
	alert: petAlertSchema,
});

export const petAlertUploadSocketDataSchema = z.object({
	requestId: z.string().uuid(),
	alertId: z.string().uuid(),
	status: z.nativeEnum(PetAlertUploadStatusEnum),
	embeddingStatus: z.nativeEnum(PetAlertEmbeddingStatusEnum),
	alert: petAlertSchema,
	error: z.string().nullable().optional(),
});

export const petAlertMatchSchema = z.object({
	matchedAlert: petAlertSchema,
	confidenceScore: z.number(),
	imageSimilarity: z.number(),
	matchedAttributes: z.array(z.string()),
	createdAt: z.string(),
});

export const petAlertMatchArraySchema = z.array(petAlertMatchSchema);

export const petAlertUploadAcceptedEnvelopeSchema = createApiEnvelopeSchema(
	petAlertUploadAcceptedSchema,
);
export const petAlertEnvelopeSchema = createApiEnvelopeSchema(petAlertSchema);
export const petAlertListEnvelopeSchema = createApiEnvelopeSchema(
	z.array(petAlertSchema),
);
export const petAlertMatchesEnvelopeSchema = createApiEnvelopeSchema(
	petAlertMatchArraySchema,
);

export const petAlertCreatePayloadSchema = z.object({
	requestId: z.string().uuid(),
	pulseId: z.string().uuid(),
	userId: z.string(),
	alertType: z.nativeEnum(PetAlertTypeEnum),
	petType: z.string().min(1),
	color: z.string().min(1),
	breed: z.string().trim().optional().nullable(),
	imageUrl: z.string().url(),
});

export const petAlertFormSchema = z.object({
	userId: z.string(),
	alertType: z.nativeEnum(PetAlertTypeEnum),
	petType: z.string().trim().min(1),
	color: z.string().trim().min(1),
	breed: z.string().trim().optional().nullable(),
	notes: z.string().trim().optional(),
	imageUrl: z.string().url(),
	urgency: z.nativeEnum(UrgencyEnum),
});

export type ClientPetAlert = z.infer<typeof petAlertSchema>;
export type PetAlertCreatePayload = z.infer<typeof petAlertCreatePayloadSchema>;
export type PetAlertUploadAccepted = z.infer<
	typeof petAlertUploadAcceptedSchema
>;
export type PetAlertUploadSocketData = z.infer<
	typeof petAlertUploadSocketDataSchema
>;
export type PetAlertMatch = z.infer<typeof petAlertMatchSchema>;
export type PetAlertFormValues = z.infer<typeof petAlertFormSchema>;
