import { z } from "zod";
import { clientPulseSchema, clientUserSchema, geoPointSchema } from "./types";

export const notificationPayloadSchema = z
	.record(z.string(), z.unknown())
	.nullable();
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

export const notificationActorSchema = clientUserSchema.pick({
	id: true,
	name: true,
	email: true,
	image: true,
});
export type NotificationActor = z.infer<typeof notificationActorSchema>;

export const pulseResponseNotificationPayloadSchema = z.object({
	pulseId: z.string(),
	responseId: z.string(),
	pulseTitle: z.string().optional(),
	responderId: z.string().optional(),
	responderName: z.string().optional(),
	note: z.string().nullable().optional(),
	isActionable: z.boolean().optional(),
});
export type PulseResponseNotificationPayload = z.infer<
	typeof pulseResponseNotificationPayloadSchema
>;

export const heroAlertNotificationPayloadSchema = z.object({
	pulseId: z.string(),
	type: z.string().optional(),
	description: z.string().nullable().optional(),
	pulseTitle: z.string().optional(),
	matchedTags: z.array(z.string()).optional(),
	distanceMeters: z.number().optional(),
	usedLiveLocation: z.boolean().optional(),
	quietHoursBypassed: z.boolean().optional(),
	conversationId: z.string().optional(),
	pulse: clientPulseSchema.optional(),
});
export type HeroAlertNotificationPayload = z.infer<
	typeof heroAlertNotificationPayloadSchema
>;

export const pulseUpdatedNotificationPayloadSchema = z.object({
	pulseId: z.string(),
	status: z.string().optional(),
	isResolved: z.boolean().optional(),
	type: z.string().optional(),
	title: z.string().optional(),
	location: geoPointSchema.optional(),
	pulse: clientPulseSchema.optional(),
});
export type PulseUpdatedNotificationPayload = z.infer<
	typeof pulseUpdatedNotificationPayloadSchema
>;

export const pulseResponseAcceptedNotificationPayloadSchema = z.object({
	pulseId: z.string(),
	responseId: z.string(),
	pulseTitle: z.string().optional(),
	ownerName: z.string().optional(),
	conversationId: z.string().nullable().optional(),
});
export type PulseResponseAcceptedNotificationPayload = z.infer<
	typeof pulseResponseAcceptedNotificationPayloadSchema
>;

export const notificationListItemSchema = z.object({
	notification: z
		.object({
			id: z.string(),
			userId: z.string(),
			type: z.string(),
			payload: notificationPayloadSchema,
			createdAt: z.string(),
		})
		.nullable(),
	user: notificationActorSchema.nullable(),
});
export type NotificationListItem = z.infer<typeof notificationListItemSchema>;

export const notificationsPayloadSchema = z.object({
	res: z.array(notificationListItemSchema),
});

function isRecord(
	value: NotificationPayload,
): value is Record<string, unknown> {
	return value !== null && typeof value === "object";
}

export function labelForNotificationType(type: string): string {
	switch (type) {
		case "HERO_ALERT":
			return "Pulse nearby";
		case "PULSE_RESPONSE":
			return "Help offer";
		case "PULSE_RESPONSE_ACCEPTED":
			return "Help accepted";
		case "PULSE_CONFIRMED":
			return "Pulse confirmed";
		case "MESSAGE":
			return "Message";
		case "TRANSACTION":
			return "Borrow / lend";
		case "FEEDBACK":
			return "Feedback";
		default:
			return type;
	}
}

export function summarizeNotificationPayload(
	type: string,
	payload: NotificationPayload,
) {
	if (!isRecord(payload)) return "";

	if (type === "HERO_ALERT") {
		const alertType =
			typeof payload.type === "string" ? payload.type : undefined;
		const description =
			typeof payload.description === "string" ? payload.description : undefined;
		const matchedTags = Array.isArray(payload.matchedTags)
			? payload.matchedTags.filter(
					(entry): entry is string => typeof entry === "string",
				)
			: [];
		const distanceMeters =
			typeof payload.distanceMeters === "number"
				? `${Math.round(payload.distanceMeters)}m away`
				: undefined;
		return (
			[
				alertType && `Type: ${alertType}`,
				matchedTags.length > 0 && `Matched: ${matchedTags.join(", ")}`,
				distanceMeters,
				description,
			]
				.filter(Boolean)
				.join(" · ") || "Nearby pulse"
		);
	}

	if (type === "PULSE_RESPONSE") {
		const name =
			typeof payload.responderName === "string"
				? payload.responderName
				: undefined;
		const title =
			typeof payload.pulseTitle === "string" ? payload.pulseTitle : undefined;
		return `${name ?? "Someone"} offered help${title ? ` on “${title}”` : ""}.`;
	}

	if (type === "PULSE_RESPONSE_ACCEPTED") {
		const owner =
			typeof payload.ownerName === "string" ? payload.ownerName : undefined;
		const title =
			typeof payload.pulseTitle === "string" ? payload.pulseTitle : undefined;
		return `${owner ?? "Someone"} accepted your help${title ? ` for “${title}”` : ""}.`;
	}

	if (type === "PULSE_CONFIRMED") {
		const count =
			typeof payload.confirmationCount === "number"
				? payload.confirmationCount
				: undefined;
		const title =
			typeof payload.pulseTitle === "string" ? payload.pulseTitle : undefined;
		return `${title ? `“${title}” ` : "This pulse "}was verified${count ? ` by ${count} neighbors` : ""}.`;
	}

	return "";
}

export function getPulseResponseActionPayload(
	payload: NotificationPayload,
): Pick<PulseResponseNotificationPayload, "pulseId" | "responseId"> | null {
	if (!isRecord(payload)) {
		return null;
	}

	const pulseId =
		typeof payload.pulseId === "string" ? payload.pulseId : undefined;
	const responseId =
		typeof payload.responseId === "string" ? payload.responseId : undefined;
	const isActionable =
		payload.isActionable === undefined ? true : payload.isActionable === true;

	if (!pulseId || !responseId || !isActionable) {
		return null;
	}

	return { pulseId, responseId };
}
