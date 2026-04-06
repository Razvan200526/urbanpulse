import { Button } from "@client/components/Button/Button";
import { HelpIcon } from "@client/components/icons/HelpIcon";
import { Avatar } from "@client/components/user/Avatar";
import { useAlertsPageStore } from "@client/pages/alerts/store";
import {
	useAcceptHelpOffer,
	useRejectHelpOffer,
} from "@client/pages/map/hooks";
import {
	getPulseResponseActionPayload,
	labelForNotificationType,
	type NotificationListItem,
} from "@client/utils/notifications";
import { cn, Toast } from "@heroui/react";
import { BellDot } from "lucide-react";

export const AlertCard = ({
	notificationItem,
	isActive = false,
}: {
	notificationItem: NotificationListItem;
	isActive?: boolean;
}) => {
	const acceptHelp = useAcceptHelpOffer();
	const rejectHelp = useRejectHelpOffer();
	const selectAlert = useAlertsPageStore((state) => state.selectAlert);

	const notificationType = notificationItem.notification?.type || "";
	const payload = notificationItem.notification?.payload ?? null;
	const pulseResponsePayload = getPulseResponseActionPayload(
		notificationType === "PULSE_RESPONSE" ? payload : null,
	);
	const createdAt = notificationItem.notification?.createdAt
		? new Date(notificationItem.notification.createdAt).toLocaleString()
		: "Unknown time";
	const isActionPending = acceptHelp.isPending || rejectHelp.isPending;
	const alertType =
		typeof payload?.type === "string"
			? payload.type
			: labelForNotificationType(notificationType);

	return (
		<article
			className={cn(
				"w-full cursor-pointer rounded border border-accent/40 bg-surface px-4 py-4 text-left transition-colors duration-150 ease-out",
				isActive ? "border-accent bg-accent/5" : "hover:border-accent",
			)}
		>
			<button
				type="button"
				className="w-full text-left"
				onClick={() =>
					notificationItem.notification?.id &&
					selectAlert(notificationItem.notification.id)
				}
			>
				<div className="flex items-start gap-4">
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0 flex items-center justify-start gap-2">
								<Avatar user={notificationItem.user} />
								<p className="truncate text-md font-semibold text-accent">
									{notificationItem.user?.name || "System alert"}
								</p>
							</div>

							<div className="text-xs text-muted">
								<span>{createdAt}</span>
							</div>
						</div>

						<div className="mt-4 flex items-center gap-2 text-sm text-foreground">
							{pulseResponsePayload ? (
								<HelpIcon className="size-6 text-accent" />
							) : (
								<BellDot className="size-4 text-accent" />
							)}
							<span className="text-sm font-normal">{alertType}</span>
						</div>
					</div>
				</div>
			</button>
			{pulseResponsePayload ? (
				<div className="mt-4 flex flex-col gap-2 sm:flex-row">
					<Button
						radius="md"
						size="sm"
						isDisabled={isActionPending}
						onPress={() => {
							acceptHelp.mutate(pulseResponsePayload, {
								onSuccess: () => Toast.toast.success("Help offer accepted"),
								onError: (error: Error) =>
									Toast.toast.danger(
										error instanceof Error
											? error.message
											: "Could not accept offer",
									),
							});
						}}
						className="border border-success bg-surface px-3 text-success transition-colors duration-150 ease-out hover:bg-success/10"
					>
						Accept
					</Button>
					<Button
						variant="danger-soft"
						radius="md"
						size="sm"
						isDisabled={isActionPending}
						onPress={() => {
							rejectHelp.mutate(pulseResponsePayload, {
								onSuccess: () => Toast.toast.success("Help offer rejected"),
								onError: (error: Error) =>
									Toast.toast.danger(
										error instanceof Error
											? error.message
											: "Could not reject offer",
									),
							});
						}}
					>
						Reject
					</Button>
				</div>
			) : null}
		</article>
	);
};
