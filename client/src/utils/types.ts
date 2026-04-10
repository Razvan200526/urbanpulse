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

export const clientPulseSchema = z.object({
	id: z.string(),
	type: z.nativeEnum(PulseEnum),
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
	mergedIntoPulseId: z.string().nullable(),
	moderationNote: z.string().nullable(),
	createdAt: z.string(),
});

export type ClientPulseType = z.infer<typeof clientPulseSchema>;

export type ResponseType<T> = {
	data: T;
	success: boolean;
	message: string;
};
