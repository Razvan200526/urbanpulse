import { hono, queryClient } from "@client/lib/api/client";
import { parseApiData, parseValueWithSchema } from "@client/lib/api/parse";
import { useHelpOfferUiStore } from "@client/stores/helpOfferUiStore";
import {
	type NotificationListItem,
	type NotificationPayload,
	notificationListItemSchema,
	notificationsPayloadSchema,
	pulseResponseNotificationPayloadSchema,
} from "@client/utils/notifications";
import { Toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { backend } from "client/sdk/backend";
import { useEffect } from "react";
import { z } from "zod";

const notificationSocketDataSchema = z.object({
	type: z.string(),
	payload: z.record(z.string(), z.unknown()),
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
) => {
	const parsed = parseValueWithSchema(
		{
			notification: {
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
		(old) => (old ? [parsed, ...old] : [parsed]),
	);
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
				if (!response.success) {
					return;
				}

				if (response.channelName === "notifications:broadcast") {
					const parsed = parseValueWithSchema(
						response.data,
						notificationSocketDataSchema,
						"Failed to process live notification",
					);

					invalidatePulseQueries();
					prependNotification(userId, parsed.payload, parsed.type);
					Toast.toast.success(response.message);
					return;
				}

				if (response.channelName === "notifications:pulse_updated") {
					invalidatePulseQueries();
					return;
				}

				if (response.channelName === "notifications:pulse_response") {
					queryClient.invalidateQueries({
						queryKey: ["notifications", userId],
					});
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

					useHelpOfferUiStore.getState().show({
						pulseId: actionPayload.pulseId,
						responseId: actionPayload.responseId,
						message:
							response.message || "A neighbor offered help on your pulse",
					});
					return;
				}

				if (response.channelName === "notifications:help_accepted") {
					queryClient.invalidateQueries({
						queryKey: ["notifications", userId],
					});
					queryClient.invalidateQueries({
						queryKey: ["messages", "conversations"],
					});
					Toast.toast.success(response.message || "Your help was accepted");
					return;
				}

				if (response.channelName === "notifications:pulse_confirmed") {
					queryClient.invalidateQueries({
						queryKey: ["notifications", userId],
					});
					invalidatePulseQueries();
					Toast.toast.success(
						response.message || "Your pulse has been verified",
					);
					return;
				}

				if (response.channelName === "notifications:message") {
					queryClient.invalidateQueries({
						queryKey: ["messages", "conversations"],
					});
					queryClient.invalidateQueries({
						queryKey: ["notifications", userId],
					});
					Toast.toast.success(response.message || "New message");
					return;
				}

				if (response.channelName === "notifications:transaction") {
					queryClient.invalidateQueries({
						queryKey: ["pending", "requests", userId],
					});
					Toast.toast.success(response.message || "New borrow request!");
				}
			},
		);

		return unsubscribe;
	}, [userId]);

	return query;
};
