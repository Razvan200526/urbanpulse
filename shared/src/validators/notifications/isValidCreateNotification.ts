import * as z from "zod";

export const notificationTypeSchema = z.enum([
	"PULSE_CONFIRMED",
	"HERO_ALERT",
	"MESSAGE",
	"TRANSACTION",
	"FEEDBACK",
]);

export const notificationCreateSchema = z.object({
	userId: z.string(),
	type: notificationTypeSchema,
	payload: z.json(),
});

export type CreateNotification = z.infer<typeof notificationCreateSchema>;
