import {
	notificationRepository,
	type NotificationRepository,
} from "@server/repositories/NotificationRepository";
import type { NotificationType } from "@server/db/schema";
import { notificationCreateSchema } from "@shared/validators/notifications/isValidCreateNotification";
import { logger } from "@server/utils/Logger";
import { socketManager } from "@server/services/SocketManager";

/**
 * Service for managing user notifications and real-time broadcasting.
 */
export class NotificationService {
	private notificationRepo: NotificationRepository;

	constructor() {
		this.notificationRepo = notificationRepository;
	}

	/**
	 * Creates a new notification record in the database.
	 * @param {Partial<NotificationType>} data - The notification data to persist.
	 * @returns {Promise<NotificationType | null>} The created notification or null on failure.
	 */
	async createNotification(data: Partial<NotificationType>) {
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
	async getNotifications(userId: string) {
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

		// 1. Find connected users in range (500m)
		// We use the singleton instance to get active connections
		const nearbyConnections = socketManager.getConnectionsInRange(
			position,
			500,
		);

		logger.info(`Found ${nearbyConnections.length} active users in range`);

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
		for (const conn of nearbyConnections) {
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
	 * Generic broadcast method for system-wide notifications.
	 * @param {NotificationType} data - The notification to broadcast.
	 */
	async broadcastNotification(data: NotificationType) {}
}

export const notificationService = new NotificationService();
