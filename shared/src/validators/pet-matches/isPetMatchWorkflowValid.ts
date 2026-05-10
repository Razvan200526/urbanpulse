import {
	PetAlertEmbeddingStatusEnum,
	PetAlertTypeEnum,
	PetMatchStatusEnum,
} from "@shared/types";
import * as z from "zod";

export const petMatchViewerRoleSchema = z.enum(["lost_owner", "finder"]);

export const petMatchActorSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	image: z.string().nullable(),
});

export const petMatchAlertSchema = z.object({
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
	ownerUserId: z.string(),
});

export const petMatchRecordSchema = z.object({
	id: z.string().uuid(),
	lostAlertId: z.string().uuid(),
	foundAlertId: z.string().uuid(),
	status: z.nativeEnum(PetMatchStatusEnum),
	confidenceScore: z.number(),
	imageSimilarity: z.number(),
	matchedAttributes: z.array(z.string()),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const petMatchWorkflowItemSchema = z.object({
	petMatch: petMatchRecordSchema,
	baseAlert: petMatchAlertSchema,
	matchedAlert: petMatchAlertSchema,
	counterpartUser: petMatchActorSchema,
	viewerRole: petMatchViewerRoleSchema,
});

export const petMatchWorkflowListSchema = z.array(petMatchWorkflowItemSchema);

export const petMatchActionResponseSchema = z.object({
	item: petMatchWorkflowItemSchema,
	conversationId: z.string().uuid().nullable().optional(),
});

export const petMatchIdParamSchema = z.object({
	petMatchId: z.string().uuid(),
});

export const petMatchAlertIdParamSchema = z.object({
	petAlertId: z.string().uuid(),
});

export const petMatchCandidateNotificationBodySchema = z.object({
	petMatchIds: z.array(z.string().uuid()).min(1),
});

export type PetMatchViewerRole = z.infer<typeof petMatchViewerRoleSchema>;
export type PetMatchActor = z.infer<typeof petMatchActorSchema>;
export type PetMatchAlert = z.infer<typeof petMatchAlertSchema>;
export type PetMatchRecord = z.infer<typeof petMatchRecordSchema>;
export type PetMatchWorkflowItem = z.infer<typeof petMatchWorkflowItemSchema>;
export type PetMatchActionResponse = z.infer<
	typeof petMatchActionResponseSchema
>;
export type PetMatchCandidateNotificationBody = z.infer<
	typeof petMatchCandidateNotificationBodySchema
>;
