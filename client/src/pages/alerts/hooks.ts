import { useAuth } from "@client/hooks/useAuth";
import { useNotifications } from "@client/hooks/useNotifications";
import { isActionableNotification } from "@client/utils/notifications";
import { useMemo } from "react";
import { useAlertsPageStore } from "./store";

export const useAlertsPageData = ({
	selectedAlertId = null,
	isMobile = false,
}: {
	selectedAlertId?: string | null;
	isMobile?: boolean;
} = {}) => {
	const { data: user } = useAuth();
	const { data: notifications, isPending } = useNotifications(
		user?.user.id || "",
	);
	const filter = useAlertsPageStore((state) => state.filter);

	const allNotifications =
		notifications?.filter((notification) => {
			return notification.notification?.type !== "MESSAGE";
		}) ?? [];

	const actionableCount = useMemo(
		() =>
			allNotifications.filter((item) =>
				isActionableNotification(
					item.notification?.type || "",
					item.notification?.payload ?? null,
				),
			).length,
		[allNotifications],
	);

	const filteredNotifications = useMemo(() => {
		if (filter === "all")
			return allNotifications.filter((notification) => {
				return notification.notification?.type !== "MESSAGE";
			});

		return allNotifications.filter((item) => {
			const isActionable = isActionableNotification(
				item.notification?.type || "",
				item.notification?.payload ?? null,
			);

			if (filter === "actionable") {
				return isActionable;
			}

			return !isActionable;
		});
	}, [allNotifications, filter]);

	const hasSelectedAlert = filteredNotifications.some(
		(item) => item.notification?.id === selectedAlertId,
	);
	const resolvedSelectedAlertId = hasSelectedAlert
		? selectedAlertId
		: isMobile
			? null
			: (filteredNotifications[0]?.notification?.id ?? null);
	const selectedItem =
		filteredNotifications.find(
			(item) => item.notification?.id === resolvedSelectedAlertId,
		) ?? null;

	return {
		isPending,
		filter,
		allNotifications,
		actionableCount,
		updatesCount: allNotifications.length - actionableCount,
		filteredNotifications,
		resolvedSelectedAlertId,
		selectedItem,
	};
};
