import type { NotificationType, PulseType } from "@server/db/schema";
import {
	type NotificationRepository,
	notificationRepository,
} from "@server/repositories/NotificationRepository";
import { socketManager } from "@server/services/SocketManager";
import { logger } from "@server/utils/Logger";
import { notificationCreateSchema } from "@shared/validators/notifications/isValidCreateNotification";

/**
 * Service for managing user notifications and real-time broadcasting.
 */
export class NotificationService {
	private notificationRepo: NotificationRepository;

	constructor() {
		this.notificationRepo = notificationRepository;
	}

	private recipientsNearPulse(position: { x: number; y: number }) {
		let recipients = socketManager.getConnectionsInRange(position, 500);
		if (recipients.length === 0) {
			const allConnections = socketManager.getAllConnections();
			if (allConnections.length > 0) {
				logger.info(
					`No users found in range — falling back to all ${allConnections.length} connected user(s).`,
				);
				recipients = allConnections;
			}
		}
		return recipients;
	}

	/**
	 * Creates a new notification record in the database.
	 * @param {Partial<NotificationType>} data - The notification data to persist.
	 * @returns {Promise<NotificationType | null>} The created notification or null on failure.
	 */
	async createNotification(
		data: Partial<NotificationType>,
	): Promise<NotificationType | null> {
		try {
			const {
				data: notificationReq,
				error,
				success,
			} = notificationCreateSchema.safeParse(data);
			if (!success || error) {
				logger.exception(error);
				logger.error("Failed to create notification");
				return null;
			}
			const newNotification =
				await this.notificationRepo.create(notificationReq);
			return newNotification;
		} catch (error) {
			if (error instanceof Error) {
				logger.exception(error);
			}
			logger.error("Failed to create notification");
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
			const notifications = await this.notificationRepo.getByUserId(userId);
			return notifications;
		} catch (error) {
			if (error instanceof Error) {
				logger.exception(error);
			}
			logger.error(`Failed to get notifications for user ${userId}`);
			return [];
		}
	}

	/**
	 * Broadcasts a pulse alert to all active users within range of the pulse location.
	 * @param {any} pulseData - The data of the newly created pulse.
	 */
	async broadcastToNearbyUsers(pulseData: any) {
		const { position, type, description, id } = pulseData;

		// Verify that 'position' is {x, y} where x=Long and y=Lat
		logger.info(
			`Broadcasting pulse ${id} to users near [Long: ${position.x}, Lat: ${position.y}]`,
		);

		const recipients = this.recipientsNearPulse(position);
		logger.info(`Broadcasting to ${recipients.length} user(s)`);

		const broadcastData = {
			success: true,
			channelName: "notifications:broadcast",
			data: {
				type: "HERO_ALERT",
				payload: {
					pulseId: id,
					type,
					description,
					location: position,
				},
			},
			message: "New pulse nearby!",
		};

		// 2. Send to each user and persist to their history
		for (const conn of recipients) {
			logger.info(`Sending alert to User ${conn.userId}`);
			conn.ws.send(JSON.stringify(broadcastData));

			// 3. Save to DB so user sees it in their history later
			await this.createNotification({
				userId: conn.userId,
				type: "HERO_ALERT",
				payload: broadcastData.data.payload as any,
			});
		}
	}

	/**
	 * Notifies connected neighbors that a pulse changed (status, resolution, etc.).
	 * Does not persist to notification history — clients refetch the pulse list.
	 */
	broadcastPulseUpdated(pulse: PulseType) {
		const { position, id, status, isResolved, title, type: pulseKind } = pulse;
		logger.info(
			`Broadcasting pulse update ${id} near [Long: ${position.x}, Lat: ${position.y}]`,
		);
		const recipients = this.recipientsNearPulse(position);
		const broadcastData = {
			success: true,
			channelName: "notifications:pulse_updated",
			data: {
				type: "PULSE_UPDATED",
				payload: {
					pulseId: id,
					status,
					isResolved,
					type: pulseKind,
					title,
					location: position,
				},
			},
			message: "A nearby pulse was updated",
		};
		for (const conn of recipients) {
			conn.ws.send(JSON.stringify(broadcastData));
		}
	}

	/**
	 * Direct notification to the pulse author when someone offers help.
	 */
	async notifyPulseOwnerOfResponse(params: {
		ownerUserId: string;
		responseId: string;
		pulseId: string;
		pulseTitle: string;
		responderId: string;
		responderName: string;
		note: string;
	}) {
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
		const broadcastData = {
			success: true,
			channelName: "notifications:pulse_response",
			data: {
				type: "PULSE_RESPONSE",
				payload,
			},
			message,
		};
		const body = JSON.stringify(broadcastData);
		for (const conn of socketManager.getConnectionsForUser(ownerUserId)) {
			conn.ws.send(body);
		}
		await this.createNotification({
			userId: ownerUserId,
			type: "PULSE_RESPONSE",
			payload,
		});
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
		const broadcastData = {
			success: true,
			channelName: "notifications:help_accepted",
			data: {
				type: "PULSE_RESPONSE_ACCEPTED",
				payload,
			},
			message,
		};
		const body = JSON.stringify(broadcastData);
		for (const conn of socketManager.getConnectionsForUser(responderUserId)) {
			conn.ws.send(body);
		}
		await this.createNotification({
			userId: responderUserId,
			type: "PULSE_RESPONSE_ACCEPTED",
			payload,
		});
	}

	/**
	 * Generic broadcast method for system-wide notifications.
	 * @param {NotificationType} data - The notification to broadcast.
	 */
	// async broadcastNotification(data: NotificationType) {}
}

export const notificationService = new NotificationService();
