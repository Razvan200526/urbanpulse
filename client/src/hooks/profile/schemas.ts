import { clientUserSchema, geoPointSchema } from "@client/utils/types";
import { z } from "zod";

export const weekdaySchema = z.enum([
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
	"Sun",
]);

export const quietHoursSchema = z.object({
	id: z.string(),
	startTime: z.string(),
	endTime: z.string(),
	days: z.array(weekdaySchema),
});

export const alertPreferencesSchema = z.object({
	homeLocation: geoPointSchema.nullable(),
	lastKnownLocation: geoPointSchema.nullable(),
	lastKnownLocationUpdatedAt: z.string().nullable(),
	heroAlertRadiusMeters: z.number(),
});

export const userProfilePayloadSchema = z.object({
	user: clientUserSchema,
	quietHours: quietHoursSchema.nullable(),
	skillTags: z.array(z.string()),
	alertPreferences: alertPreferencesSchema,
});

export type Weekday = z.infer<typeof weekdaySchema>;
export type QuietHoursForm = z.infer<typeof quietHoursSchema>;
export type UserProfilePayload = z.infer<typeof userProfilePayloadSchema>;
