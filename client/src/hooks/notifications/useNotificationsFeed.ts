import { hono, queryClient } from "@client/lib/api/client";
import { parseApiData, parseValueWithSchema } from "@client/lib/api/parse";
import { useCrisisStore } from "@client/stores/crisisStore";
import { useHelpOfferUiStore } from "@client/stores/helpOfferUiStore";
import { clientClusterSchema } from "@client/utils/clusterTypes";
import {
	documentMatchNotificationPayloadSchema,
	getPetMatchNotificationPayload,
	type NotificationListItem,
	type NotificationPayload,
	notificationListItemSchema,
	notificationsPayloadSchema,
	petMatchNotificationPayloadSchema,
	pulseNotificationSchema,
	pulseResponseNotificationPayloadSchema,
} from "@client/utils/notifications";
import { syncPulseInCache } from "@client/utils/pulseCache";
import { Toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { backend } from "client/sdk/backend";
import { useEffect, useState } from "react";
import { z } from "zod";

const notificationSocketDataSchema = z.object({
	type: z.string(),
	payload: z.record(z.string(), z.unknown()),
	notification: notificationListItemSchema.shape.notification.optional(),
});

const fetchNotifications = async () => {
	const response = await hono.api.notifications.$get();
	const parsed = await parseApiData(
		response,
		notificationsPayloadSchema,
		"Failed to load notifications",
	);

	return parsed.data.res;
};

const invalidatePulseQueries = () => {
	queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
	queryClient.invalidateQueries({ queryKey: ["pulse", "map"] });
};

const prependNotification = (
	currentUserId: string,
	payload: NotificationPayload,
	type: string,
	notification?: NotificationListItem["notification"],
) => {
	const parsed = parseValueWithSchema(
		{
			notification: notification ?? {
				id: crypto.randomUUID(),
				userId: currentUserId,
				type,
				payload,
				createdAt: new Date().toISOString(),
			},
			user: null,
		},
		notificationListItemSchema,
		"Failed to process live notification",
	);

	queryClient.setQueryData<NotificationListItem[]>(
		["notifications", currentUserId],
		(old) => [
			parsed,
			...(old ?? []).filter(
				(item) => item.notification?.id !== parsed.notification?.id,
			),
		],
	);
};

const prependSocketNotification = (
	currentUserId: string,
	parsed: z.infer<typeof notificationSocketDataSchema>,
) => {
	prependNotification(
		currentUserId,
		parsed.payload,
		parsed.type,
		parsed.notification,
	);
};

const syncPulseNotification = (data: unknown) => {
	const parsed = parseValueWithSchema(
		data,
		pulseNotificationSchema,
		"Failed to process pulse notification",
	);

	if (!parsed.payload.pulse) {
		invalidatePulseQueries();
		return parsed;
	}

	syncPulseInCache(parsed.payload.pulse);
	return parsed;
};

export const useNotificationSocketOpen = () => {
	const [isOpen, setIsOpen] = useState(() => backend.notifications.isOpen);

	useEffect(() => {
		return backend.notifications.on("status", setIsOpen);
	}, []);

	return isOpen;
};

export const useNotifications = (userId: string) => {
	const query = useQuery<NotificationListItem[]>({
		queryKey: ["notifications", userId],
		enabled: userId !== "",
		queryFn: fetchNotifications,
	});

	useEffect(() => {
		if (userId === "") {
			return;
		}

		const unsubscribe = backend.notifications.on<unknown>(
			"message",
			(response) => {
				if (response.channelName === "notifications:broadcast") {
					if (response.success === false) {
						return;
					}

					const parsed = parseValueWithSchema(
						response.data,
						notificationSocketDataSchema,
						"Failed to process live notification",
					);

					syncPulseNotification(response.data);
					prependSocketNotification(userId, parsed);
					queryClient.invalidateQueries({
						queryKey: ["dashboard", "overview"],
					});
					Toast.toast.success(response.message || "Nearby pulse alert");
					return;
				}

				if (response.channelName === "notifications:pulse_updated") {
					if (response.success === false) {
						return;
					}

					syncPulseNotification(response.data);
					return;
				}

				if (response.type === "CRISIS_MODE_ACTIVATED") {
					try {
						const clusterData = (response as any).cluster;
						const parsed = clientClusterSchema.parse(clusterData);
						useCrisisStore.getState().addCrisis(parsed);
						queryClient.invalidateQueries({
							queryKey: ["pulse", "clusters"],
						});
						queryClient.invalidateQueries({
							queryKey: ["dashboard", "overview"],
						});
						Toast.toast.warning("CRISIS MODE ACTIVATED NEAR YOU!");
					} catch (error) {
						// biome-ignore lint/suspicious/noConsole: essential for debugging live crisis notifications
						console.error("Failed to process crisis notification", error);
					}
					return;
				}

				if (response.channelName === "notifications:pulse_response") {
					if (response.success === false) {
						return;
					}

					invalidatePulseQueries();

					const parsed = parseValueWithSchema(
						response.data,
						notificationSocketDataSchema,
						"Failed to process help offer",
					);
					const actionPayload = parseValueWithSchema(
						parsed.payload,
						pulseResponseNotificationPayloadSchema,
						"Failed to process help offer",
					);

					prependSocketNotification(userId, parsed);
					queryClient.invalidateQueries({
						queryKey: ["dashboard", "overview"],
					});
					useHelpOfferUiStore.getState().show({
						pulseId: actionPayload.pulseId,
						responseId: actionPayload.responseId,
						message:
							response.message || "A neighbor offered help on your pulse",
					});
					return;
				}

				if (
					response.channelName === "notifications:pet_alert_match" ||
					response.channelName === "notifications:pet_alert_match_interested" ||
					response.channelName === "notifications:pet_alert_match_accepted" ||
					response.channelName === "notifications:pet_alert_match_declined"
				) {
					if (response.success === false) {
						return;
					}

					const parsed = parseValueWithSchema(
						response.data,
						notificationSocketDataSchema,
						"Failed to process pet match notification",
					);
					const petMatchPayload = parseValueWithSchema(
						parsed.payload,
						petMatchNotificationPayloadSchema,
						"Failed to process pet match notification",
					);

					prependSocketNotification(userId, parsed);
					queryClient.invalidateQueries({ queryKey: ["pet-matches"] });

					if (petMatchPayload.conversationId) {
						queryClient.invalidateQueries({
							queryKey: ["messages", "conversations"],
						});
					}

					queryClient.invalidateQueries({
						queryKey: ["dashboard", "overview"],
					});
					Toast.toast.success(
						response.message ||
							(getPetMatchNotificationPayload(parsed.type, parsed.payload)
								?.conversationId
								? "Pet match chat ready"
								: "Possible pet match update"),
					);
					return;
				}

				if (response.channelName === "notifications:document_match") {
					if (response.success === false) {
						return;
					}

					const parsed = parseValueWithSchema(
						response.data,
						notificationSocketDataSchema,
						"Failed to process document match notification",
					);
					const documentMatchPayload = parseValueWithSchema(
						parsed.payload,
						documentMatchNotificationPayloadSchema,
						"Failed to process document match notification",
					);

					prependSocketNotification(userId, parsed);
					queryClient.invalidateQueries({
						queryKey: ["lost-documents", "matches"],
					});
					queryClient.invalidateQueries({
						queryKey: ["dashboard", "overview"],
					});
					Toast.toast.success(
						response.message ||
							`Potential document match found (${Math.round(
								documentMatchPayload.matchScore,
							)}% confidence)`,
					);
					return;
				}

				if (response.channelName === "notifications:help_accepted") {
					if (response.success === false) {
						return;
					}

					const parsed = parseValueWithSchema(
						response.data,
						notificationSocketDataSchema,
						"Failed to process accepted help notification",
					);

					prependSocketNotification(userId, parsed);
					queryClient.invalidateQueries({
						queryKey: ["messages", "conversations"],
					});
					queryClient.invalidateQueries({
						queryKey: ["dashboard", "overview"],
					});
					Toast.toast.success(response.message || "Your help was accepted");
					return;
				}

				if (response.channelName === "notifications:pulse_confirmed") {
					if (response.success === false) {
						return;
					}

					const parsed = parseValueWithSchema(
						response.data,
						notificationSocketDataSchema,
						"Failed to process pulse confirmation",
					);

					prependSocketNotification(userId, parsed);
					invalidatePulseQueries();
					queryClient.invalidateQueries({
						queryKey: ["dashboard", "overview"],
					});
					Toast.toast.success(
						response.message || "Your pulse has been verified",
					);
					return;
				}

				if (response.channelName === "notifications:message") {
					if (response.success === false) {
						return;
					}

					const parsed = parseValueWithSchema(
						response.data,
						notificationSocketDataSchema,
						"Failed to process message notification",
					);

					prependSocketNotification(userId, parsed);
					queryClient.invalidateQueries({
						queryKey: ["messages", "conversations"],
					});
					queryClient.invalidateQueries({
						queryKey: ["dashboard", "overview"],
					});
					Toast.toast.success(response.message || "New message");
					return;
				}

				if (response.channelName === "notifications:transaction") {
					if (response.success === false) {
						return;
					}

					const parsed = parseValueWithSchema(
						response.data,
						notificationSocketDataSchema,
						"Failed to process transaction notification",
					);

					prependSocketNotification(userId, parsed);
					queryClient.invalidateQueries({
						queryKey: ["pending", "requests", userId],
					});
					queryClient.invalidateQueries({ queryKey: ["resources"] });
					queryClient.invalidateQueries({
						queryKey: ["dashboard", "overview"],
					});
					Toast.toast.success(response.message || "Resource request updated");
				}
			},
		);

		return unsubscribe;
	}, [userId]);

	return query;
};
