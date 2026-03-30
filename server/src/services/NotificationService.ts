import type { NotificationType, PulseType } from "@server/db/schema";
import {
	type NotificationRepository,
	notificationRepository,
} from "@server/repositories/NotificationRepository";
import {
	socketManager,
	type UserConnection,
} from "@server/services/SocketManager";
import {
	type BroadcastDataType,
	type NotificationFactory,
	notificationFactory,
} from "@server/shared/NotificationFactory";
import type { PulseRepsponseParamsType } from "@server/types";
import { handleError } from "@server/utils/handleError";
import { logger } from "@server/utils/Logger";
import { isNotificationCreateValid } from "@shared/validators/notifications/isValidCreateNotification";
import { isPulseDataValid } from "@shared/validators/pulses/isPulseDataValid";
import { type LocationService, locationService } from "./LocationService";

/**
 * Service for managing user notifications and real-time broadcasting.
 */
export class NotificationService {
	private notificationRepo: NotificationRepository;
	private locationService: LocationService;
	private notificationFactory: NotificationFactory;

	constructor() {
		this.notificationRepo = notificationRepository;
		this.locationService = locationService;
		this.notificationFactory = notificationFactory;
	}

	/**
	 * Creates a new notification record in the database.
	 * @param {Partial<NotificationType>} data - The notification data to persist.
	 * @returns {Promise<NotificationType | null>} The created notification or null on failure.
	 */
	async createNotification(
		data: Partial<NotificationType>,
	): Promise<NotificationType | null> {
		const { data: notificationData, success } = isNotificationCreateValid(data);
		if (!success) return null;
		try {
			return await this.notificationRepo.create(notificationData);
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	/**
	 * Retrieves all notifications for a specific user from history.
	 * @param {string} userId - ID of the user.
	 * @returns {Promise<NotificationType[]>} Array of notifications.
	 */
	async getNotifications(userId: string): Promise<NotificationType[]> {
		try {
			return await this.notificationRepo.getByUserId(userId);
		} catch (error) {
			handleError(error);
			return [];
		}
	}

	/**
	 *
	 * @param userIds
	 * Retrieves all notifications with the users that posted them
	 * @returns All notifications with users (it joins their tables).Used for displaying notifications with user details.
	 */
	async getNotificationsWithUsers(userId?: string) {
		try {
			if (userId) {
				return await this.notificationRepo.getNotificationsWithUsersByUserId(
					userId,
				);
			}
			return await this.notificationRepo.getNotificationsWithUsers();
		} catch (error) {
			handleError(error);
			return [];
		}
	}
	/**
	 * Broadcasts a pulse alert to all active users within range of the pulse location.
	 * @param {Partial<PulseType>} pulseData - The data of the newly created pulse.
	 */
	async broadcastToNearbyUsers(pulseData: Partial<PulseType>) {
		const { success, data } = isPulseDataValid(pulseData);
		if (!success) return;
		const recipients = this.locationService.getNearbyConnections(data.position);

		const broadcastData = this.notificationFactory.create({
			type: "HERO_ALERT",
			payload: {
				pulseId: data.id,
				type: data.type,
				description: data.description,
				location: data.position,
			},
			message: "New pulse nearby!",
		});
		await this.sendAndSaveData(recipients, broadcastData);
	}

	/**
	 *
	 * @param recipients Array of UserConnection types
	 * @param broadcastData The data to broadcast to the recipients(created by notificationFactory)
	 * @param persist Whether to persist the notification to the database
	 */
	async sendAndSaveData(
		recipients: UserConnection[],
		broadcastData: BroadcastDataType<unknown>,
		persist: boolean = true,
	) {
		logger.info(
			`Broadcasting notification to ${recipients.length} recipients: ${broadcastData.message}`,
		);
		const persistedUserIds = new Set<string>();
		for (const conn of recipients) {
			conn.ws.send(JSON.stringify(broadcastData));
			if (persist && !persistedUserIds.has(conn.userId)) {
				persistedUserIds.add(conn.userId);
				await this.createNotification({
					userId: conn.userId,
					type: broadcastData.data.type,
					payload: broadcastData.data.payload,
				});
			}
		}
	}

	async notifyUsers(
		userIds: string[],
		broadcastData: BroadcastDataType<unknown>,
		persist: boolean = true,
	) {
		const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));

		for (const userId of uniqueUserIds) {
			const connections = socketManager.getConnectionsForUser(userId);
			for (const connection of connections) {
				connection.ws.send(JSON.stringify(broadcastData));
			}

			if (persist) {
				await this.createNotification({
					userId,
					type: broadcastData.data.type,
					payload: broadcastData.data.payload,
				});
			}
		}
	}

	/**
	 * Notifies connected neighbors that a pulse changed (status, resolution, etc.).
	 * Does not persist to notification history — clients refetch the pulse list.
	 */
	broadcastPulseUpdated(pulse: PulseType) {
		const { position, id, status, isResolved, title, type: pulseKind } = pulse;
		const recipients = this.locationService.getNearbyConnections(position);
		const broadcastData = this.notificationFactory.create({
			message: "A pulse nearby was updated",
			payload: {
				pulseId: id,
				status,
				isResolved,
				type: pulseKind,
				title,
				location: position,
			},
			type: "PULSE_UPDATED",
		});
		this.sendAndSaveData(recipients, broadcastData, false);
	}

	/**
	 * Direct notification to the pulse author when someone offers help.
	 */
	async notifyPulseOwnerOfResponse(params: PulseRepsponseParamsType) {
		const {
			ownerUserId,
			responseId,
			pulseId,
			pulseTitle,
			responderId,
			responderName,
			note,
		} = params;
		const payload = {
			responseId,
			pulseId,
			pulseTitle,
			responderId,
			responderName,
			note,
		};
		const message = `${responderName} offered help on "${pulseTitle}"`;
		const broadcastData = this.notificationFactory.create({
			type: "PULSE_RESPONSE",
			payload,
			message,
		});
		await this.notifyUsers([ownerUserId], broadcastData);
	}

	/**
	 * Lets the responder know their help offer was accepted.
	 */
	async notifyResponderHelpAccepted(params: {
		responderUserId: string;
		pulseId: string;
		pulseTitle: string;
		ownerName: string;
		responseId: string;
	}) {
		const { responderUserId, pulseId, pulseTitle, ownerName, responseId } =
			params;
		const payload = {
			pulseId,
			pulseTitle,
			ownerName,
			responseId,
		};
		const message = `${ownerName} accepted your help for “${pulseTitle}”`;
		const broadcastData = this.notificationFactory.create({
			type: "PULSE_RESPONSE_ACCEPTED",
			payload,
			message,
		});
		await this.notifyUsers([responderUserId], broadcastData);
	}

	async notifyPulseConfirmed(params: {
		ownerUserId: string;
		pulseId: string;
		pulseTitle: string;
		confirmationCount: number;
	}) {
		const { ownerUserId, pulseId, pulseTitle, confirmationCount } = params;
		const payload = {
			pulseId,
			pulseTitle,
			confirmationCount,
		};
		const message = `Your pulse "${pulseTitle}" was verified by ${confirmationCount} neighbors`;
		const broadcastData = this.notificationFactory.create({
			type: "PULSE_CONFIRMED",
			payload,
			message,
		});
		await this.notifyUsers([ownerUserId], broadcastData);
	}

	/**
	 * Generic broadcast method for system-wide notifications.
	 * @param {NotificationType} data - The notification to broadcast.
	 */
	// async broadcastNotification(data: NotificationType) {}
}

export const notificationService = new NotificationService();
