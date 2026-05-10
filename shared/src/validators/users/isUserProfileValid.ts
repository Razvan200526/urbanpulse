import * as z from "zod";

const weekdaySchema = z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
export const geoPointSchema = z.object({
	x: z.number(),
	y: z.number(),
});

export const userProfileUpdateSchema = z.object({
	name: z.string().trim().min(1).max(80),
	bio: z.string().trim().max(500).optional().default(""),
	image: z.string().trim().url().optional().or(z.literal("")).nullable(),
	firstName: z.string().trim().min(1).max(80).optional().nullable(),
	lastName: z.string().trim().min(1).max(80).optional().nullable(),
	birthYear: z.number().int().min(1900).max(2024).optional().nullable(),
	homeCity: z.string().trim().min(1).max(100).optional().nullable(),
});

export const quietHoursUpsertSchema = z.object({
	startTime: z.string().regex(/^\d{2}:\d{2}$/),
	endTime: z.string().regex(/^\d{2}:\d{2}$/),
	days: z.array(weekdaySchema).min(1).max(7),
});

export const skillTagsUpdateSchema = z.object({
	tags: z.array(z.string().trim().min(1).max(100)).max(12),
});

export const alertPreferencesUpdateSchema = z.object({
	homeLocation: geoPointSchema.nullable(),
	heroAlertRadiusMeters: z.number().int().min(100).max(5000),
});

export type UserProfileUpdateType = z.infer<typeof userProfileUpdateSchema>;
export type QuietHoursUpsertType = z.infer<typeof quietHoursUpsertSchema>;
export type SkillTagsUpdateType = z.infer<typeof skillTagsUpdateSchema>;
export type AlertPreferencesUpdateType = z.infer<
	typeof alertPreferencesUpdateSchema
>;
