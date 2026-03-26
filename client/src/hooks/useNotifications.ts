import { hono, queryClient } from "@client/main";
import { backend } from "client/sdk/backend";
import { Toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

type NotificationData = { type: string; payload: Record<string, unknown> };

export const useNotifications = (userId: string | undefined) => {
	const query = useQuery({
		queryKey: ["notifications", userId],
		enabled: !!userId,
		queryFn: async () => {
			const res = await hono.api.notifications.$get();
			const data = await res.json();
			if (!data.success) throw new Error(data.message);
			return data.data;
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
					queryClient.setQueryData(["notifications", userId], (old: any) => {
						const newNotif = {
							id: crypto.randomUUID(),
							userId,
							type: response.data.type,
							payload: response.data.payload,
							read: false,
							createdAt: new Date().toISOString(),
						};
						return old ? [newNotif, ...old] : [newNotif];
					});
					Toast.toast.success(`${response.message}`);
				}
			},
		);

		return unsubscribe;
	}, [userId]);

	return query;
};
