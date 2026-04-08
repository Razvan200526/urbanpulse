import { H4 } from "@client/components/typography";
import { ScrollShadow } from "@heroui/react";
import { useAlertsPageData } from "../hooks";
import { useAlertsPageStore } from "../store";
import { AlertCard } from "./AlertCard";
import { AlertsEmptyState } from "./AlertsEmptyState";

export const AlertsFeed = () => {
  const { filteredNotifications } = useAlertsPageData();
  const selectedAlertId = useAlertsPageStore((state) => state.selectedAlertId);

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded border border-border bg-surface">
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <H4>Your alerts</H4>
      </div>
      <ScrollShadow
        size={8}
        hideScrollBar
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        {filteredNotifications.length !== 0 ? (
          <AlertsEmptyState />
        ) : (
          <div className="flex flex-col gap-4">
            {filteredNotifications.map((notificationItem, index) => {
              const notificationId = notificationItem.notification?.id;
              const activeId =
                selectedAlertId ?? filteredNotifications[0]?.notification?.id;

              return (
                <AlertCard
                  key={notificationId ?? index}
                  notificationItem={notificationItem}
                  isActive={notificationId === activeId}
                />
              );
            })}
          </div>
        )}
      </ScrollShadow>
    </div>
  );
};
