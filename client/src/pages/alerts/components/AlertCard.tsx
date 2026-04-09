import { Button } from "@client/components/Button/Button";
import { HelpIcon } from "@client/components/icons/HelpIcon";
import { Avatar } from "@client/components/user/Avatar";
import {
	useAcceptHelpOffer,
	useRejectHelpOffer,
} from "@client/pages/map/hooks";
import {
	getPulseResponseActionPayload,
	labelForNotificationType,
	type NotificationListItem,
} from "@client/utils/notifications";
import { Chip, cn, Toast } from "@heroui/react";
import { BellDot } from "lucide-react";
import { useNavigate } from "react-router";

export const AlertCard = ({
	notificationItem,
	isActive = false,
}: {
	notificationItem: NotificationListItem;
	isActive?: boolean;
}) => {
	const navigate = useNavigate();
	const acceptHelp = useAcceptHelpOffer();
	const rejectHelp = useRejectHelpOffer();

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
	const cardContent = (
		<div className="flex items-start gap-3">
			<Avatar user={notificationItem.user} />

			<div className="min-w-0 flex-1 space-y-3">
				<div className="flex min-w-0 items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="truncate text-md font-semibold text-accent">
							{notificationItem.user?.name || "System alert"}
						</p>
					</div>

					<div className="shrink-0 text-right text-xs text-muted">
						<span>{createdAt}</span>
					</div>
				</div>

				<div className="flex items-center gap-2 text-sm text-foreground">
					<Chip className="rounded border border-accent bg-accent/10 p-1">
						<Chip.Label className="flex items-center justify-center gap-1">
							{pulseResponsePayload ? (
								<HelpIcon className="size-6 text-accent" />
							) : (
								<BellDot className="size-4 text-accent" />
							)}
							<span className="text-xs font-semibold text-accent">
								{alertType}
							</span>
						</Chip.Label>
					</Chip>
				</div>
			</div>
		</div>
	);

	return (
		<article
			className={cn(
				"w-full rounded border border-border bg-surface px-4 py-4 text-left transition-colors duration-150 ease-out my-1",
				isActive ? "border-accent bg-accent/5" : "hover:border-accent",
			)}
		>
			<button
				type="button"
				className="w-full cursor-pointer text-left"
				onClick={() => {
					const notificationId = notificationItem.notification?.id;

					if (notificationId) {
						navigate(`/alerts/${notificationId}`);
					}
				}}
			>
				{cardContent}
			</button>
			{pulseResponsePayload ? (
				<div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
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
