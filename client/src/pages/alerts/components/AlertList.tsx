import type { NotificationListItem } from "@client/utils/notifications";
import { AlertCard } from "./AlertCard";

export const AlertList = ({
	items,
	activeAlertId,
}: {
	items?: NotificationListItem[];
	activeAlertId: string | null;
}) => {
	return (
		<>
			{items?.map((notificationItem, index) => {
				const notificationId = notificationItem.notification?.id ?? null;

				return (
					<AlertCard
						key={notificationId ?? index}
						notificationItem={notificationItem}
						isActive={notificationId === activeAlertId}
					/>
				);
			})}
		</>
	);
};
