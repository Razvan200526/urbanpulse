import * as z from "zod";

export const notificationTypeSchema = z.enum([
	"PULSE_CONFIRMED",
	"HERO_ALERT",
	"PULSE_RESPONSE",
	"PULSE_RESPONSE_ACCEPTED",
	"PET_ALERT_MATCH",
	"PET_ALERT_MATCH_INTERESTED",
	"PET_ALERT_MATCH_ACCEPTED",
	"PET_ALERT_MATCH_DECLINED",
	"MESSAGE",
	"TRANSACTION",
	"FEEDBACK",
	"PULSE_UPDATED",
	"DOCUMENT_MATCH",
]);

export const notificationCreateSchema = z.object({
	userId: z.string(),
	type: notificationTypeSchema,
	payload: z.json(),
});

export const isNotificationCreateValid = (data: unknown) => {
	return notificationCreateSchema.safeParse(data);
};

export type CreateNotification = z.infer<typeof notificationCreateSchema>;
