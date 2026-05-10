import {
	PulseEnum,
	PulseStatusEnum,
	PulseUploadStateEnum,
	UrgencyEnum,
} from "@shared/types";
import { z } from "zod";

export const geoPointSchema = z.object({
	x: z.number(),
	y: z.number(),
});

export const clientUserSchema = z.object({
	id: z.string(),
	image: z.string().nullable(),
	role: z.string().nullable(),
	name: z.string(),
	email: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	emailVerified: z.boolean(),
	rememberMe: z.boolean().nullable(),
	bio: z.string().nullable(),
	trustScore: z.number().nullable(),
	successfulInteractions: z.number().nullable(),
	isVerified: z.boolean().nullable(),
});

export type ClientUserType = z.infer<typeof clientUserSchema>;

export const clientIncidentTypeSchema = z.object({
	id: z.string(),
	slug: z.string(),
	label: z.string(),
	description: z.string().nullable(),
	isActive: z.boolean(),
	isSystem: z.boolean(),
	sortOrder: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type ClientIncidentType = z.infer<typeof clientIncidentTypeSchema>;

export const clientPulseSchema = z.object({
	id: z.string(),
	type: z.nativeEnum(PulseEnum),
	incidentTypeId: z.string().nullable().optional().default(null),
	incidentType: clientIncidentTypeSchema.nullable().optional().default(null),
	userId: z.string(),
	urgency: z.nativeEnum(UrgencyEnum),
	title: z.string(),
	description: z.string().nullable(),
	position: geoPointSchema,
	status: z.nativeEnum(PulseStatusEnum),
	pulseUploadState: z.nativeEnum(PulseUploadStateEnum),
	audioUrl: z.string().nullable(),
	imageUrls: z.array(z.string()),
	requestedSkillTags: z.array(z.string()),
	matchMetadata: z.record(z.string(), z.unknown()),
	isResolved: z.boolean(),
	isVerified: z.boolean().nullable(),
	authorRole: z.string().nullable().optional().default(null),
	authorTrustScore: z.number().nullable().optional().default(null),
	authorIsVerified: z.boolean().nullable().optional().default(null),
	mergedIntoPulseId: z.string().nullable(),
	moderationNote: z.string().nullable(),
	locationPrecision: z
		.enum(["exact", "approximate"])
		.optional()
		.default("exact"),
	createdAt: z.string(),
});

export type ClientPulseType = z.infer<typeof clientPulseSchema>;

export type ResponseType<T> = {
	data: T;
	success: boolean;
	message: string;
};
