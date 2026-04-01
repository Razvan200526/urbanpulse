import { Button } from "@client/components/Button/Button";
import { Avatar } from "@client/components/user/Avatar";
import {
	useAcceptHelpOffer,
	useRejectHelpOffer,
} from "@client/pages/map/hooks";
import {
	getPulseResponseActionPayload,
	labelForNotificationType,
	summarizeNotificationPayload,
	type NotificationListItem,
	type NotificationPayload,
} from "@client/utils/notifications";
import { ScrollShadow, Toast } from "@heroui/react";
import {
	Activity,
	AlertTriangle,
	Clock3,
	MapPinned,
	Siren,
	UserRoundCheck,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useAlertsPageData } from "../hooks";
import { useAlertsPageStore } from "../store";

const isRecord = (
	value: NotificationPayload,
): value is Record<string, unknown> =>
	value !== null && typeof value === "object";

const formatLabel = (value: string) =>
	value
		.replace(/([A-Z])/g, " $1")
		.replace(/[_-]/g, " ")
		.trim();

const formatValue = (value: unknown) => {
	if (value == null) return "Not available";
	if (typeof value === "string" || typeof value === "number")
		return String(value);
	if (typeof value === "boolean") return value ? "Yes" : "No";
	return JSON.stringify(value);
};

const getSeverityLabel = (item: NotificationListItem | null) => {
	const payload = item?.notification?.payload;
	if (typeof payload?.type === "string") return payload.type;
	if (item?.notification?.type === "PULSE_RESPONSE") return "Action";
	if (item?.notification?.type === "PULSE_RESPONSE_ACCEPTED") return "Resolved";
	if (item?.notification?.type === "PULSE_CONFIRMED") return "Verified";
	return "Alert";
};

const getLocationLabel = (payload: NotificationPayload) => {
	if (!isRecord(payload)) {
		return "Live coordinates are not available for this alert.";
	}

	const rawLocation = payload.location;
	if (typeof rawLocation === "string") return rawLocation;

	if (
		rawLocation &&
		typeof rawLocation === "object" &&
		"x" in rawLocation &&
		"y" in rawLocation &&
		typeof rawLocation.x === "number" &&
		typeof rawLocation.y === "number"
	) {
		return `${rawLocation.y.toFixed(4)}, ${rawLocation.x.toFixed(4)}`;
	}

	return "Neighborhood map position linked to the selected pulse.";
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

const buildNotes = (item: NotificationListItem | null) => {
	const payload = item?.notification?.payload;
	if (!payload) return [];
	const summary = summarizeNotificationPayload(
		item?.notification?.type || "",
		payload,
	);
	const notes = [
		{
			label: item?.user?.name || "System",
			value:
				item?.user?.email || summary || "Event logged in the alerts queue.",
		},
	];

	if (summary) {
		notes.push({
			label: "Summary",
			value: summary,
		});
	}

	if (isRecord(payload)) {
		for (const [key, value] of Object.entries(payload).slice(0, 4)) {
			notes.push({
				label: formatLabel(key),
				value: formatValue(value),
			});
		}
	}

	return notes;
};

export const AlertDetailsDrawer = () => {
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
	const pulseResponsePayload = getPulseResponseActionPayload(
		notificationType === "PULSE_RESPONSE" ? payload : null,
	);
	const createdAt = selectedItem?.notification?.createdAt
		? new Date(selectedItem.notification.createdAt).toLocaleString()
		: "Unknown time";
	const severityLabel = getSeverityLabel(selectedItem);
	const notes = buildNotes(selectedItem);
	const dataPoints = buildDataPoints(selectedItem);

	return (
		<div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
			<div className="border-b border-border px-5 py-4">
				<h2 className="text-[1.05rem] font-semibold text-foreground">
					Alert Details - {severityLabel}
				</h2>
			</div>

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
						<div className="overflow-hidden rounded-lg border border-border bg-[linear-gradient(180deg,rgba(119,82,198,0.26),rgba(23,18,36,0.88))]">
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
									<p className="truncate text-sm text-muted">
										{selectedItem.user?.email || "No sender email"}
									</p>
									<div className="mt-2 flex items-center gap-2 text-sm text-muted">
										<Clock3 className="size-4" />
										<span>{createdAt}</span>
									</div>
								</div>
							</div>
						</div>

						<div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
							<div className="overflow-hidden rounded-lg border border-border bg-surface-secondary/55">
								<div className="relative min-h-46 overflow-hidden border-b border-border">
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="relative">
											<span className="absolute left-1/2 top-1/2 block size-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-danger/50 blur-md" />
											<MapPinned className="relative size-10 text-accent" />
										</div>
									</div>
								</div>
								<div className="px-4 py-3 text-sm text-muted">
									<span className="font-semibold text-foreground">
										Location:
									</span>{" "}
									{getLocationLabel(payload)}
								</div>
							</div>

							<div className="rounded-lg border border-border bg-surface-secondary/55 p-4">
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
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							{pulseResponsePayload ? (
								<>
									<Button
										radius="md"
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
										className="h-12 border border-accent/60 bg-accent text-accent-foreground"
									>
										Accept
									</Button>
									<Button
										radius="md"
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
										className="h-12 border border-accent/60 bg-transparent text-accent"
									>
										Reject
									</Button>
								</>
							) : (
								<>
									<Button
										radius="md"
										className="h-12 border border-accent/60 bg-accent text-accent-foreground"
									>
										Resolve Alert
									</Button>
									<Button
										radius="md"
										className="h-12 border border-accent/60 bg-transparent text-accent"
										isDisabled
									>
										Assign to Responder
									</Button>
								</>
							)}
						</div>

						<div className="rounded-lg border border-border bg-surface-secondary/55 p-4">
							<div className="flex items-center gap-2 text-[1.05rem] font-semibold text-foreground">
								<UserRoundCheck className="size-5 text-accent" />
								<span>History &amp; Notes</span>
							</div>
							<div className="mt-4 space-y-4">
								{notes.map((note, index) => (
									<div key={`${note.label}`} className="flex gap-3">
										<div className="flex flex-col items-center">
											<span className="mt-1 block size-3 rounded-full bg-accent" />
											{index < notes.length - 1 ? (
												<span className="mt-2 block min-h-8 w-px bg-border" />
											) : null}
										</div>
										<div className="min-w-0">
											<p className="text-sm font-semibold text-foreground">
												{note.label}
											</p>
											<p className="wrap-break-word text-sm text-muted">
												{note.value}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="flex items-center gap-2 text-xs text-muted">
							<Siren className="size-4" />
							<span>
								{labelForNotificationType(notificationType)} view active
							</span>
						</div>
					</div>
				)}
			</ScrollShadow>
		</div>
	);
};
