import type { NotificationType } from "@shared/types";

export class NotificationFactory {
	private notificationMap: Record<NotificationType, `${string}:${string}`> = {
		HERO_ALERT: "notifications:broadcast",
		PULSE_RESPONSE: "notifications:pulse_response",
		PULSE_RESPONSE_ACCEPTED: "notifications:help_accepted",
		PULSE_CONFIRMED: "notifications:pulse_confirmed",
		PET_ALERT_MATCH: "notifications:pet_alert_match",
		PET_ALERT_MATCH_INTERESTED: "notifications:pet_alert_match_interested",
		PET_ALERT_MATCH_ACCEPTED: "notifications:pet_alert_match_accepted",
		PET_ALERT_MATCH_DECLINED: "notifications:pet_alert_match_declined",
		MESSAGE: "notifications:message",
		TRANSACTION: "notifications:transaction",
		FEEDBACK: "notifications:feedback",
		PULSE_UPDATED: "notifications:pulse_updated",
	};

	/**
	 *
	 * @param data Object
	 * @param type NotificationType string
	 * @param payload generic type T can be anything(doesn't mean it should)
	 * @param message string
	 * @returns
	 */
	create<T>(data: {
		type: NotificationType;
		payload: T;
		message: string;
	}): BroadcastDataType<T> {
		return {
			success: true,
			channelName: this.notificationMap[data.type],
			data: {
				type: data.type,
				payload: data.payload,
			},
			message: data.message,
		};
	}
}

export const notificationFactory = new NotificationFactory();

export type BroadcastDataType<T> = {
	success: boolean;
	channelName: string;
	data: {
		type: NotificationType;
		payload: T;
		notification?: unknown;
	};
	message: string;
};
