import { Button } from "@client/components/Button/Button";
import {
	useAcceptHelpOffer,
	useRejectHelpOffer,
} from "@client/pages/map/hooks";
import { useAlertsPageStore } from "@client/pages/alerts/store";
import {
	getPulseResponseActionPayload,
	labelForNotificationType,
	type NotificationListItem,
	type NotificationPayload,
} from "@client/utils/notifications";
import { Chip, Toast } from "@heroui/react";
import { BellDot, Sparkles } from "lucide-react";

const getAlertTone = (
	notificationType: string,
	payload: NotificationPayload,
) => {
	if (notificationType === "HERO_ALERT") {
		const pulseType = typeof payload?.type === "string" ? payload.type : "";
		if (pulseType.toLowerCase() === "emergency") {
			return {
				dot: "bg-danger",
				border: "border-accent/70 bg-[rgba(107,74,165,0.22)]",
			};
		}

		return {
			dot: "bg-warning",
			border: "border-border bg-surface",
		};
	}

	if (notificationType === "PULSE_RESPONSE") {
		return {
			dot: "bg-accent",
			border: "border-border bg-surface",
		};
	}

	return {
		dot: "bg-sky-400",
		border: "border-border bg-surface",
	};
};

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
	const tone = getAlertTone(notificationType, payload);
	const alertType =
		typeof payload?.type === "string"
			? payload.type
			: labelForNotificationType(notificationType);

	return (
		<button
			type="button"
			onClick={() =>
				notificationItem.notification?.id &&
				selectAlert(notificationItem.notification.id)
			}
			className={`w-full rounded-lg border px-4 py-4 text-left transition-colors duration-150 ease-out cursor-pointer ${
				isActive ? `border-accent bg-surface` : tone.border
			}`}
		>
			<div className="flex items-start gap-4">
				<div className="flex pt-1">
					<span
						className={`block size-4 rounded-full ${tone.dot}`}
						aria-hidden="true"
					/>
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="truncate text-[1.05rem] font-semibold text-foreground">
								{notificationItem.user?.name || "System alert"}
							</p>
							<p className="truncate text-sm text-muted">
								{notificationItem.user?.email || "No sender email"}
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-2 text-xs text-muted">
							<Chip
								color="default"
								variant="soft"
								size="sm"
								className="rounded-full border border-accent bg-surface text-accent h-7"
							>
								<Chip.Label>
									{labelForNotificationType(notificationType)}
								</Chip.Label>
							</Chip>
							<span>{createdAt}</span>
						</div>
					</div>

					<div className="mt-5 flex items-center gap-2 text-sm text-foreground">
						{pulseResponsePayload ? (
							<Sparkles className="size-4 text-accent" />
						) : (
							<BellDot className="size-4 text-accent" />
						)}
						<span className="text-sm font-normal">{alertType}</span>
					</div>

					{pulseResponsePayload ? (
						<div className="mt-4 flex items-center gap-2">
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
								className="border border-success/40 bg-success px-3 text-success-foreground"
							>
								Accept
							</Button>
							<Button
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
								className="border border-danger/40 bg-transparent px-3 text-danger"
							>
								Reject
							</Button>
						</div>
					) : null}
				</div>
			</div>
		</button>
	);
};
