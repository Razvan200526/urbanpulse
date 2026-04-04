import { Button } from "@client/components/Button/Button";
import { H4 } from "@client/components/typography";
import { Avatar } from "@client/components/user/Avatar";
import {
	useAcceptHelpOffer,
	useRejectHelpOffer,
} from "@client/pages/map/hooks";
import {
	getPulseResponseActionPayload,
	labelForNotificationType,
	type NotificationListItem,
	type NotificationPayload,
} from "@client/utils/notifications";
import { ScrollShadow, Toast } from "@heroui/react";
import { Activity, AlertTriangle, MessagesSquareIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAlertsPageData } from "../hooks";
import { useAlertsPageStore } from "../store";

const isRecord = (
	value: NotificationPayload,
): value is Record<string, unknown> =>
	value !== null && typeof value === "object";

const getSeverityLabel = (item: NotificationListItem | null) => {
	const payload = item?.notification?.payload;
	if (typeof payload?.type === "string") return payload.type;
	if (item?.notification?.type === "PULSE_RESPONSE") return "Action";
	if (item?.notification?.type === "PULSE_RESPONSE_ACCEPTED") return "Resolved";
	if (item?.notification?.type === "PULSE_CONFIRMED") return "Verified";
	return "Alert";
};

const buildDataPoints = (item: NotificationListItem | null) => {
	const payload = item?.notification?.payload;
	if (!payload) return [];
	const payloadCount = isRecord(payload) ? Object.keys(payload).length : 0;

	return [
		{
			label: "Channel",
			value: labelForNotificationType(item?.notification?.type || "Alert"),
		},
		{
			label: "Status",
			value:
				item?.notification?.type === "PULSE_RESPONSE"
					? "Needs response"
					: item?.notification?.type === "PULSE_RESPONSE_ACCEPTED"
						? "Handled"
						: "Logged",
		},
		{
			label: "Payload",
			value: payloadCount > 0 ? `${payloadCount} fields` : "Minimal",
		},
	];
};

export const AlertDetailsDrawer = () => {
	const navigate = useNavigate();
	const { filteredNotifications } = useAlertsPageData();
	const selectedAlertId = useAlertsPageStore((state) => state.selectedAlertId);
	const selectAlert = useAlertsPageStore((state) => state.selectAlert);
	const acceptHelp = useAcceptHelpOffer();
	const rejectHelp = useRejectHelpOffer();

	const selectedItem = useMemo(() => {
		return (
			filteredNotifications.find(
				(item) => item.notification?.id === selectedAlertId,
			) ??
			filteredNotifications[0] ??
			null
		);
	}, [filteredNotifications, selectedAlertId]);

	useEffect(() => {
		if (!selectedAlertId && selectedItem?.notification?.id) {
			selectAlert(selectedItem.notification.id);
		}
	}, [selectedAlertId, selectedItem, selectAlert]);

	const notificationType = selectedItem?.notification?.type || "";
	const payload = selectedItem?.notification?.payload ?? null;
	const acceptedConversationId =
		isRecord(payload) && typeof payload.conversationId === "string"
			? payload.conversationId
			: null;
	const pulseResponsePayload = getPulseResponseActionPayload(
		notificationType === "PULSE_RESPONSE" ? payload : null,
	);
	const createdAt = selectedItem?.notification?.createdAt
		? new Date(selectedItem.notification.createdAt).toLocaleString()
		: "Unknown time";
	const severityLabel = getSeverityLabel(selectedItem);
	const dataPoints = buildDataPoints(selectedItem);

	return (
		<div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
			<header className="border-b border-border px-5 py-4">
				<H4>Alert Details - {severityLabel}</H4>
			</header>

			<ScrollShadow
				size={8}
				hideScrollBar
				className="min-h-0 flex-1 overflow-y-auto px-5 py-5"
			>
				{!selectedItem ? (
					<div className="flex h-full min-h-96 items-center justify-center rounded-lg border border-dashed border-border bg-surface-secondary/35 p-8 text-sm text-muted">
						Select an alert to inspect its pulse details.
					</div>
				) : (
					<div className="space-y-4">
						<div className="overflow-hidden rounded-lg border border-border bg-surface">
							<div className="flex items-center gap-2 border-b border-white/6 px-4 py-4 text-[1.05rem] font-semibold text-foreground">
								<AlertTriangle className="size-5 text-danger" />
								<span>
									{severityLabel} Alert - {selectedItem.user?.name || "System"}
								</span>
							</div>
							<div className="flex items-center gap-4 px-4 py-4">
								<Avatar user={selectedItem.user} />
								<div className="min-w-0">
									<p className="truncate text-lg font-semibold text-foreground">
										{selectedItem.user?.name || "System"}
									</p>
									<div className="mt-2 text-sm text-muted">
										<span>{createdAt}</span>
									</div>
								</div>
							</div>
						</div>

						<div className="rounded border border-border bg-surface-secondary p-4">
							<div className="flex items-center gap-2 text-[1.05rem] font-semibold text-foreground">
								<Activity className="size-5 text-accent" />
								<span>Vitals &amp; Data</span>
							</div>
							<div className="mt-4 space-y-3">
								{dataPoints.map((point) => (
									<div
										key={point.label}
										className="flex items-center justify-between rounded border border-white/6 bg-black/10 px-3 py-2"
									>
										<span className="text-sm text-muted">{point.label}</span>
										<span className="text-sm font-medium text-foreground">
											{point.value}
										</span>
									</div>
								))}
							</div>
							<p className="mt-4 text-sm text-muted">
								{isRecord(payload)
									? `Data readings: ${Object.keys(payload).length} structured fields`
									: "Data readings: limited payload"}
							</p>
						</div>

						<div className="flex items-center justify-start gap-4">
							{pulseResponsePayload ? (
								<>
									<Button
										size="md"
										isDisabled={acceptHelp.isPending || rejectHelp.isPending}
										onPress={() => {
											acceptHelp.mutate(pulseResponsePayload, {
												onSuccess: () =>
													Toast.toast.success("Help offer accepted"),
												onError: (error: Error) =>
													Toast.toast.danger(
														error instanceof Error
															? error.message
															: "Could not accept offer",
													),
											});
										}}
										className="border border-success bg-surface hover:bg-success/10 text-success"
									>
										Accept
									</Button>
									<Button
										size="md"
										variant="danger-soft"
										isDisabled={acceptHelp.isPending || rejectHelp.isPending}
										onPress={() => {
											rejectHelp.mutate(pulseResponsePayload, {
												onSuccess: () =>
													Toast.toast.success("Help offer rejected"),
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
								</>
							) : (
								<Button
									radius="md"
									className="border border-accent/60 bg-accent text-accent-foreground"
									startContent={<MessagesSquareIcon className="size-4" />}
									onPress={() => {
										if (acceptedConversationId) {
											navigate(
												`/messages?conversationId=${acceptedConversationId}`,
											);
											return;
										}
									}}
									isDisabled={!acceptedConversationId}
								>
									{acceptedConversationId ? "Open Chat" : "Resolve Alert"}
								</Button>
							)}
						</div>
					</div>
				)}
			</ScrollShadow>
		</div>
	);
};
