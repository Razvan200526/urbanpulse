import { hono, queryClient } from "@client/main";
import { useHelpOfferUiStore } from "@client/stores/helpOfferUiStore";
import type {
	NotificationListItem,
	NotificationsResponse,
	PulseResponseNotificationPayload,
} from "@client/utils/notifications";
import { Toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { backend } from "client/sdk/backend";
import { useEffect } from "react";

type NotificationData = { type: string; payload: Record<string, unknown> };

export const useNotifications = (userId: string | undefined) => {
	const query = useQuery<NotificationListItem[]>({
		queryKey: ["notifications", userId],
		enabled: !!userId,
		queryFn: async () => {
			const res = await hono.api.notifications.$get();
			const data = (await res.json()) as NotificationsResponse;
			if (!data.success) throw new Error(data.message);
			return data.data?.res ?? [];
		},
	});

	useEffect(() => {
		if (!userId) return;

		const unsubscribe = backend.notifications.on<NotificationData>(
			"message",
			(response) => {
				if (
					response.success &&
					response.channelName === "notifications:broadcast"
				) {
					queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
					queryClient.setQueryData<NotificationListItem[]>(
						["notifications", userId],
						(old) => {
							const newNotif: NotificationListItem = {
								notification: {
									id: crypto.randomUUID(),
									userId,
									type: response.data.type,
									payload: response.data.payload,
									createdAt: new Date().toISOString(),
								},
								user: null,
							};
							return old ? [newNotif, ...old] : [newNotif];
						},
					);
					Toast.toast.success(`${response.message}`);
				} else if (
					response.success &&
					response.channelName === "notifications:pulse_updated"
				) {
					queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
				} else if (
					response.success &&
					response.channelName === "notifications:pulse_response"
				) {
					queryClient.invalidateQueries({
						queryKey: ["notifications", userId],
					});
					queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
					const pl = response.data?.payload as
						| Partial<PulseResponseNotificationPayload>
						| undefined;
					if (pl?.pulseId && pl?.responseId) {
						useHelpOfferUiStore.getState().show({
							pulseId: pl.pulseId,
							responseId: pl.responseId,
							message:
								response.message || "A neighbor offered help on your pulse",
						});
					} else {
						Toast.toast.success(
							response.message || "Someone offered help on your pulse",
						);
					}
				} else if (
					response.success &&
					response.channelName === "notifications:help_accepted"
				) {
					queryClient.invalidateQueries({
						queryKey: ["notifications", userId],
					});
					Toast.toast.success(response.message || "Your help was accepted");
				} else if (
					response.success &&
					response.channelName === "notifications:pulse_confirmed"
				) {
					queryClient.invalidateQueries({
						queryKey: ["notifications", userId],
					});
					queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
					Toast.toast.success(
						response.message || "Your pulse has been verified",
					);
				} else if (
					response.success &&
					response.channelName === "notifications:transaction"
				) {
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
