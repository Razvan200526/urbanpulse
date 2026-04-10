import type { NotificationListItem } from "@client/utils/notifications";
import { ScrollShadow } from "@heroui/react";
import { AlertList } from "./AlertList";
import { AlertsEmptyState } from "./AlertsEmptyState";
import { AlertsFeedSkeleton } from "./AlertsSkeletons";

export const AlertsFeed = ({
  activeAlertId,
  filteredNotifications = [],
  isPending,
}: {
  activeAlertId: string | null;
  filteredNotifications?: NotificationListItem[];
  isPending: boolean;
}) => {
  const hasItems = filteredNotifications.length > 0;

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded border border-border bg-surface">
      {isPending ? (
        <div className="min-h-0 flex-1">
          <ScrollShadow
            size={8}
            hideScrollBar
            className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
          >
            <div className="flex flex-col gap-4">
              <AlertsFeedSkeleton />
            </div>
          </ScrollShadow>
        </div>
      ) : hasItems ? (
        <ScrollShadow
          size={8}
          hideScrollBar
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        >
          <div className="flex flex-col gap-4">
            <AlertList
              activeAlertId={activeAlertId}
              items={filteredNotifications}
            />
          </div>
        </ScrollShadow>
      ) : (
        <div className="min-h-0 flex-1 p-4">
          <AlertsEmptyState />
        </div>
      )}
    </div>
  );
};
