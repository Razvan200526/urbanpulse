import type { ClientUserType } from "./types";

export type NotificationPayload = Record<string, unknown> | null;

export type NotificationActor = Pick<
	ClientUserType,
	"id" | "name" | "email" | "image"
>;

export type PulseResponseNotificationPayload = {
	pulseId: string;
	responseId: string;
	pulseTitle?: string;
	responderId?: string;
	responderName?: string;
	note?: string | null;
};

export type PulseResponseAcceptedNotificationPayload = {
	pulseId: string;
	responseId: string;
	pulseTitle?: string;
	ownerName?: string;
};

export type NotificationListItem = {
	notification: {
		id: string;
		userId: string;
		type: string;
		payload: NotificationPayload;
		createdAt: string;
	} | null;
	user: NotificationActor | null;
};

export type NotificationsResponse = {
	success: boolean;
	message: string;
	data: {
		res: NotificationListItem[];
	} | null;
};

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
		return (
			[alertType && `Type: ${alertType}`, description]
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

	if (!pulseId || !responseId) {
		return null;
	}

	return { pulseId, responseId };
}
