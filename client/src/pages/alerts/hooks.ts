import { useAuth } from "@client/hooks/useAuth";
import { useNotifications } from "@client/hooks/useNotifications";
import { getPulseResponseActionPayload } from "@client/utils/notifications";
import { useMemo } from "react";
import { useAlertsPageStore } from "./store";

export const useAlertsPageData = () => {
	const { data: user } = useAuth();
	const { data: notifications, isPending } = useNotifications(
		user?.user.id || "",
	);
	const filter = useAlertsPageStore((state) => state.filter);

	const allNotifications = notifications ?? [];

	const actionableCount = useMemo(
		() =>
			allNotifications.filter((item) =>
				Boolean(
					getPulseResponseActionPayload(
						item.notification?.type === "PULSE_RESPONSE"
							? item.notification?.payload
							: null,
					),
				),
			).length,
		[allNotifications],
	);

	const filteredNotifications = useMemo(() => {
		if (filter === "all") return allNotifications;

		return allNotifications.filter((item) => {
			const actionPayload = getPulseResponseActionPayload(
				item.notification?.type === "PULSE_RESPONSE"
					? item.notification?.payload
					: null,
			);

			if (filter === "actionable") {
				return Boolean(actionPayload);
			}

			return !actionPayload;
		});
	}, [allNotifications, filter]);

	return {
		isPending,
		filter,
		allNotifications,
		actionableCount,
		updatesCount: allNotifications.length - actionableCount,
		filteredNotifications,
	};
};
