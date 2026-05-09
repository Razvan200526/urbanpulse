import { clientClusterSchema } from "@client/utils/clusterTypes";
import {
	clientIncidentTypeSchema,
	clientPulseSchema,
} from "@client/utils/types";
import { PulseStatusEnum } from "@shared/types";
import { z } from "zod";

const moderationPulseSummarySchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	status: z.string(),
	type: z.string(),
	isVerified: z.boolean().nullable(),
	moderationNote: z.string().nullable().optional(),
	incidentType: clientIncidentTypeSchema.nullable().optional(),
});

const moderationUserSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	role: z.string().nullable(),
});

export const confirmPulseResultSchema = z.object({
	pulse: z.object({
		id: z.string(),
		isVerified: z.boolean().nullable(),
		status: z.string(),
	}),
	confirmationCount: z.number(),
	alreadyConfirmed: z.boolean(),
	newlyVerified: z.boolean(),
});

export const createReportResultSchema = z.object({
	report: z.object({
		id: z.string(),
		status: z.string(),
		reason: z.string(),
	}),
});

export const adminReportSchema = z.object({
	id: z.string(),
	reason: z.string(),
	status: z.string(),
	createdAt: z.string(),
	reporter: moderationUserSchema.nullable(),
	targetUser: moderationUserSchema.nullable(),
	targetPulse: moderationPulseSummarySchema.nullable(),
});

export const adminDuplicatePulseSchema = z.object({
	sourcePulse: moderationPulseSummarySchema.extend({
		createdAt: z.string(),
	}),
	targetPulse: moderationPulseSummarySchema.extend({
		createdAt: z.string(),
	}),
	distanceMeters: z.number(),
	hoursApart: z.number(),
	titleSimilarity: z.number(),
});

export const reviewReportResultSchema = z.object({
	report: z.object({
		id: z.string(),
		status: z.string(),
	}),
	pulse: z
		.object({
			id: z.string(),
			status: z.nativeEnum(PulseStatusEnum),
			isResolved: z.boolean(),
		})
		.nullable(),
});

export const moderatePulseResultSchema = z.object({
	pulse: clientPulseSchema.pick({
		id: true,
		status: true,
		isResolved: true,
		isVerified: true,
		moderationNote: true,
	}),
});

export const mergePulseResultSchema = z.object({
	sourcePulse: z.object({
		id: z.string(),
		mergedIntoPulseId: z.string().nullable(),
	}),
	targetPulse: z.object({
		id: z.string(),
		isVerified: z.boolean().nullable(),
	}),
});

export const adminCreateCrisisResultSchema = z.object({
	cluster: clientClusterSchema,
});

export const adminUserListItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	role: z.union([z.string(), z.array(z.string()), z.null()]),
	banned: z.boolean().optional(),
	banReason: z.string().nullable().optional(),
	banExpires: z.string().nullable().optional(),
});

export const adminUsersSchema = z.union([
	z.array(adminUserListItemSchema),
	z.object({ users: z.array(adminUserListItemSchema) }),
]);

export const adminUserSessionSchema = z.object({
	id: z.string().optional(),
	token: z.string().optional(),
	expiresAt: z.string().optional(),
	createdAt: z.string().optional(),
	ipAddress: z.string().nullable().optional(),
	userAgent: z.string().nullable().optional(),
});

export const adminUserSessionsSchema = z.union([
	z.array(adminUserSessionSchema),
	z.object({ sessions: z.array(adminUserSessionSchema) }),
]);

export type AdminUserListItem = z.infer<typeof adminUserListItemSchema>;
export type AdminUserSession = z.infer<typeof adminUserSessionSchema>;
