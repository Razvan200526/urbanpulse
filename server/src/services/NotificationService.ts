import type { NotificationType, PulseType } from "@server/db/schema";
import {
	type NotificationRepository,
	notificationRepository,
} from "@server/repositories/NotificationRepository";
import { responseRepository } from "@server/repositories/ResponseRepository";
import type { NotificationConditionOptions } from "@server/repositories/types";
import {
	socketManager,
	type UserConnection,
} from "@server/services/SocketManager";
import type { Last7DaysAlertCounts } from "@server/services/types";
import {
	type BroadcastDataType,
	type NotificationFactory,
	notificationFactory,
} from "@server/shared/NotificationFactory";
import type { PulseRepsponseParamsType } from "@server/types";
import { handleError } from "@server/utils/handleError";
import { logger } from "@server/utils/Logger";
import { ResponseStatusEnum } from "@shared/types";
import { isNotificationCreateValid } from "@shared/validators/notifications/isValidCreateNotification";
import { heroAlertMatchingService } from "./HeroAlertMatchingService";
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

	private async annotateActionableNotifications<
		T extends {
			notification: {
				type?: string | null;
				payload?: unknown;
			} | null;
		},
	>(items: T[]) {
		return await Promise.all(
			items.map(async (item) => {
				if (item.notification?.type !== "PULSE_RESPONSE") {
					return item;
				}

				const payload =
					item.notification.payload &&
					typeof item.notification.payload === "object"
						? (item.notification.payload as Record<string, unknown>)
						: null;
				const responseId =
					payload && typeof payload.responseId === "string"
						? payload.responseId
						: null;

				if (!responseId) {
					return {
						...item,
						notification: {
							...item.notification,
							payload: {
								...(payload ?? {}),
								isActionable: false,
							},
						},
					};
				}

				const response = await responseRepository.getOne(responseId);
				const isActionable = response?.status === ResponseStatusEnum.Pending;

				return {
					...item,
					notification: {
						...item.notification,
						payload: {
							...(payload ?? {}),
							isActionable,
						},
					},
				};
			}),
		);
	}

	private toSocketSafePulse(pulse: PulseType) {
		return JSON.parse(JSON.stringify(pulse)) as Record<string, unknown>;
	}

	/**
	 * Normalizes the provided date to UTC day start.
	 * @param {Date} date - Source date.
	 * @returns {Date} UTC day start.
	 */
	private startOfUtcDay(date: Date): Date {
		return new Date(
			Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
		);
	}

	/**
	 * Adds a number of days to a date.
	 * @param {Date} date - Base date.
	 * @param {number} days - Number of days to add.
	 * @returns {Date} Shifted date.
	 */
	private addDays(date: Date, days: number): Date {
		const DAY_MS = 24 * 60 * 60 * 1000;
		return new Date(date.getTime() + days * DAY_MS);
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
	 * Retrieves notifications filtered by column options and optional createdAt condition.
	 * @param {Partial<NotificationType>} options - Partial notification filters.
	 * @param {NotificationConditionOptions} [condition] - Optional createdAt range.
	 * @returns {Promise<NotificationType[] | null>} Matching notifications or null on failure.
	 */
	async getNotificationsByCondition(
		options: Partial<NotificationType>,
		condition?: NotificationConditionOptions,
	): Promise<NotificationType[] | null> {
		try {
			return await this.notificationRepo.getByOptions(options, condition);
		} catch (error) {
			handleError(error);
			return null;
		}
	}

	/**
	 * Counts notifications filtered by column options and optional createdAt condition.
	 * @param {Partial<NotificationType>} options - Partial notification filters.
	 * @param {NotificationConditionOptions} [condition] - Optional createdAt range.
	 * @returns {Promise<number>} Number of matching notifications.
	 */
	async countNotificationsByCondition(
		options: Partial<NotificationType>,
		condition?: NotificationConditionOptions,
	): Promise<number> {
		const notifications = await this.getNotificationsByCondition(
			options,
			condition,
		);
		return notifications?.length ?? 0;
	}

	/**
	 * Calculates alert counts for current and previous 7-day windows.
	 * @param {Partial<NotificationType>} options - Partial notification filters.
	 * @param {Date} [referenceDate] - Date used to anchor the rolling windows.
	 * @returns {Promise<Last7DaysAlertCounts | null>} Current and previous window counts.
	 */
	async getAlertCountsForLast7Days(
		options: Partial<NotificationType>,
		referenceDate: Date = new Date(),
	): Promise<Last7DaysAlertCounts | null> {
		try {
			const windowDays = 7;
			const todayStart = this.startOfUtcDay(referenceDate);
			const currentWindowStart = this.addDays(todayStart, -(windowDays - 1));
			const currentWindowEnd = this.addDays(todayStart, 1);
			const previousWindowStart = this.addDays(currentWindowStart, -windowDays);
			const previousWindowEnd = currentWindowStart;

			const [alertsLast7Days, previousAlertsLast7Days] = await Promise.all([
				this.countNotificationsByCondition(options, {
					createdAtFrom: currentWindowStart,
					createdAtTo: currentWindowEnd,
				}),
				this.countNotificationsByCondition(options, {
					createdAtFrom: previousWindowStart,
					createdAtTo: previousWindowEnd,
				}),
			]);

			return {
				alertsLast7Days,
				previousAlertsLast7Days,
				currentWindowStart,
				currentWindowEnd,
				previousWindowStart,
				previousWindowEnd,
			};
		} catch (error) {
			handleError(error);
			return null;
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
				return await this.annotateActionableNotifications(
					await this.notificationRepo.getNotificationsWithUsersByUserId(userId),
				);
			}
			return await this.annotateActionableNotifications(
				await this.notificationRepo.getNotificationsWithUsers(),
			);
		} catch (error) {
			handleError(error);
			return [];
		}
	}
	/**
	 * Broadcasts a pulse alert to all active users within range of the pulse location.
	 * @param {Partial<PulseType>} pulseData - The data of the newly created pulse.
	 */
	async broadcastToNearbyUsers(pulseData: PulseType) {
		const matches = await heroAlertMatchingService.matchPulse(pulseData);
		const serializedPulse = this.toSocketSafePulse(pulseData);

		for (const match of matches) {
			const broadcastData = this.notificationFactory.create({
				type: "HERO_ALERT",
				payload: {
					pulseId: pulseData.id,
					type: pulseData.type,
					description: pulseData.description,
					location: pulseData.position,
					pulseTitle: pulseData.title,
					matchedTags: match.matchedTags,
					distanceMeters: match.distanceMeters,
					usedLiveLocation: match.usedLiveLocation,
					quietHoursBypassed: match.quietHoursBypassed,
					pulse: serializedPulse,
				},
				message: `Matched nearby request: ${match.matchedTags.join(", ")}`,
			});
			await this.notifyUsers([match.user.id], broadcastData);
		}
	}

	private async getPulseLiveRecipients(pulse: PulseType) {
		const recipients = new Map<UserConnection["ws"], UserConnection>();

		for (const connection of socketManager.getConnectionsForUser(
			pulse.userId,
		)) {
			recipients.set(connection.ws, connection);
		}

		for (const connection of this.locationService.getNearbyConnections(
			pulse.position,
		)) {
			recipients.set(connection.ws, connection);
		}

		const heroMatches = await heroAlertMatchingService.matchPulse(pulse);
		for (const match of heroMatches) {
			for (const connection of socketManager.getConnectionsForUser(
				match.user.id,
			)) {
				recipients.set(connection.ws, connection);
			}
		}

		return Array.from(recipients.values());
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
	async broadcastPulseUpdated(pulse: PulseType) {
		const { position, id, status, isResolved, title, type: pulseKind } = pulse;
		const serializedPulse = this.toSocketSafePulse(pulse);
		const recipients = await this.getPulseLiveRecipients(pulse);

		const broadcastData = this.notificationFactory.create({
			message: "A pulse nearby was updated",
			payload: {
				pulseId: id,
				status,
				isResolved,
				type: pulseKind,
				title,
				location: position,
				pulse: serializedPulse,
			},
			type: "PULSE_UPDATED",
		});
		await this.sendAndSaveData(recipients, broadcastData, false);
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
		conversationId?: string | null;
	}) {
		const {
			responderUserId,
			pulseId,
			pulseTitle,
			ownerName,
			responseId,
			conversationId,
		} = params;
		const payload = {
			pulseId,
			pulseTitle,
			ownerName,
			responseId,
			conversationId,
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
