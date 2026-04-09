import { AppDrawer } from "@client/components/AppDrawer";
import { Button } from "@client/components/Button/Button";
import { BellIcon } from "@client/components/icons/BellIcon";
import { CloseIcon } from "@client/components/icons/CloseIcon";
import { H4 } from "@client/components/typography";
import { Avatar } from "@client/components/user/Avatar";
import { useIsMobile } from "@client/hooks/useMediaQuery";
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
import { useNavigate } from "react-router";
import { AlertDetailsSkeleton } from "./AlertsSkeletons";

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

export const AlertDetailsDrawer = ({
	onClose,
	selectedItem,
	isPending,
	isOpen = false,
}: {
	onClose: () => void;
	selectedItem: NotificationListItem | null;
	isPending: boolean;
	isOpen?: boolean;
}) => {
	const navigate = useNavigate();
	const isMobile = useIsMobile();
	const acceptHelp = useAcceptHelpOffer();
	const rejectHelp = useRejectHelpOffer();

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
	const detailsHeading =
		isPending || !selectedItem
			? "Alert Details"
			: `Alert Details - ${severityLabel}`;

	const detailsBody = isPending ? (
		<AlertDetailsSkeleton />
	) : !selectedItem ? (
		<div className="flex h-full min-h-96 items-center justify-center rounded border border-border bg-surface-secondary/35 p-8 text-sm text-muted">
			Select an alert to inspect its pulse details.
		</div>
	) : (
		<div className="space-y-4">
			<div className="overflow-hidden rounded border border-border bg-surface">
				<div className="flex items-center gap-2 border-b border-border px-4 py-4 text-[1.05rem] font-semibold text-foreground">
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

			<div className="rounded border border-border bg-surface p-4">
				<div className="flex items-center gap-2 text-[1.05rem] font-semibold text-foreground">
					<Activity className="size-5 text-accent" />
					<span>Vitals &amp; Data</span>
				</div>
				<div className="mt-4 space-y-3">
					{dataPoints.map((point) => (
						<div
							key={point.label}
							className="flex items-center justify-between rounded border border-accent-soft-hover bg-surface px-3 py-2"
						>
							<span className="text-sm text-muted">{point.label}</span>
							<span className="text-right text-sm font-medium text-foreground">
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

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				{pulseResponsePayload ? (
					<>
						<Button
							size="md"
							isDisabled={acceptHelp.isPending || rejectHelp.isPending}
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
							className="border border-success bg-surface text-success hover:bg-success/10"
						>
							Accept
						</Button>
						<Button
							size="md"
							variant="danger-soft"
							isDisabled={acceptHelp.isPending || rejectHelp.isPending}
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
					</>
				) : (
					<Button
						radius="md"
						className="border border-accent/60 bg-accent text-accent-foreground"
						startContent={<MessagesSquareIcon className="size-4" />}
						onPress={() => {
							if (acceptedConversationId) {
								navigate(`/messages/${acceptedConversationId}`);
							}
						}}
						isDisabled={!acceptedConversationId}
					>
						{acceptedConversationId ? "Open Chat" : "Resolve Alert"}
					</Button>
				)}
			</div>
		</div>
	);

	if (isMobile) {
		return (
			<AppDrawer
				isOpen={isOpen}
				onOpenChange={(open) => {
					if (!open) {
						onClose();
					}
				}}
				backdrop="opaque"
				placement="right"
				mobilePlacement="bottom"
				dialogClassName="border-border bg-surface"
				bodyClassName="p-0"
				header={
					<div className="border-b border-border px-4 py-4">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2 text-accent">
								<BellIcon className="size-5" />
								<H4>Alert Details</H4>
							</div>
							<Button
								variant="ghost"
								isIconOnly
								radius="full"
								className="text-accent"
								onPress={onClose}
								startContent={<CloseIcon className="size-4" />}
							/>
						</div>
					</div>
				}
			>
				<ScrollShadow
					size={8}
					hideScrollBar
					className="min-h-0 max-h-[78dvh] overflow-y-auto px-4 py-4"
				>
					{detailsBody}
				</ScrollShadow>
			</AppDrawer>
		);
	}

	return (
		<div className="hidden min-h-0 flex-col overflow-hidden rounded border border-border bg-surface xl:flex">
			<header className="border-b border-border px-5 py-4">
				<H4>{detailsHeading}</H4>
			</header>
			<ScrollShadow
				size={8}
				hideScrollBar
				className="min-h-0 flex-1 overflow-y-auto px-5 py-5"
			>
				{detailsBody}
			</ScrollShadow>
		</div>
	);
};
