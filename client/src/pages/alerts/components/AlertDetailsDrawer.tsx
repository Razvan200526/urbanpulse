import { AppDrawer } from "@client/components/AppDrawer";
import { Button } from "@client/components/Button/Button";
import { BellIcon } from "@client/components/icons/BellIcon";
import { CloseIcon } from "@client/components/icons/CloseIcon";
import { H4 } from "@client/components/typography";
import { Avatar } from "@client/components/user/Avatar";
import { useOpenDocumentMatchChat } from "@client/hooks/documentMatches";
import {
	useAcceptPetMatchAsFinder,
	useDeclinePetMatchAsFinder,
	useDismissPetMatchAsOwner,
	useMarkPetMatchOwnerInterested,
} from "@client/hooks/petMatches";
import { useIsMobile } from "@client/hooks/useMediaQuery";
import {
	useAcceptHelpOffer,
	useRejectHelpOffer,
} from "@client/pages/map/hooks";
import { useEnsureDirectConversation } from "@client/pages/messages/hooks";
import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import {
	getDocumentMatchNotificationPayload,
	getPetMatchNotificationPayload,
	getPulseResponseActionPayload,
	labelForNotificationType,
	type NotificationListItem,
	type NotificationPayload,
	summarizeNotificationPayload,
} from "@client/utils/notifications";
import {
	formatPetMatchPercent,
	petMatchStatusLabels,
} from "@client/utils/petMatches";
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
	if (
		item?.notification?.type === "PET_ALERT_MATCH" ||
		item?.notification?.type === "PET_ALERT_MATCH_INTERESTED" ||
		item?.notification?.type === "PET_ALERT_MATCH_ACCEPTED" ||
		item?.notification?.type === "PET_ALERT_MATCH_DECLINED"
	) {
		return labelForNotificationType(item.notification.type);
	}
	if (item?.notification?.type === "PULSE_RESPONSE") return "Action";
	if (item?.notification?.type === "PULSE_RESPONSE_ACCEPTED") return "Resolved";
	if (item?.notification?.type === "PULSE_CONFIRMED") return "Verified";
	return "Alert";
};

const buildDataPoints = (item: NotificationListItem | null) => {
	const payload = item?.notification?.payload;
	const petMatchPayload = getPetMatchNotificationPayload(
		item?.notification?.type || "",
		payload ?? null,
	);
	if (petMatchPayload) {
		return [
			{
				label: "Status",
				value: petMatchStatusLabels[petMatchPayload.status],
			},
			{
				label: "Confidence",
				value: formatPetMatchPercent(petMatchPayload.confidenceScore),
			},
			{
				label: "Image match",
				value: formatPetMatchPercent(petMatchPayload.imageSimilarity),
			},
		];
	}

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
	const markOwnerInterested = useMarkPetMatchOwnerInterested();
	const dismissAsOwner = useDismissPetMatchAsOwner();
	const acceptAsFinder = useAcceptPetMatchAsFinder();
	const declineAsFinder = useDeclinePetMatchAsFinder();
	const ensureDirectConversation = useEnsureDirectConversation();
	const openDocumentMatchChat = useOpenDocumentMatchChat();

	const notificationType = selectedItem?.notification?.type || "";
	const payload = selectedItem?.notification?.payload ?? null;
	const petMatchPayload = getPetMatchNotificationPayload(
		notificationType,
		payload,
	);
	const documentMatchPayload = getDocumentMatchNotificationPayload(
		notificationType,
		payload,
	);
	const acceptedConversationId =
		petMatchPayload?.conversationId ||
		(isRecord(payload) && typeof payload.conversationId === "string"
			? payload.conversationId
			: null);
	const pulseResponsePayload = getPulseResponseActionPayload(
		notificationType === "PULSE_RESPONSE" ? payload : null,
	);
	const createdAt = selectedItem?.notification?.createdAt
		? new Date(selectedItem.notification.createdAt).toLocaleString()
		: "Unknown time";
	const severityLabel = getSeverityLabel(selectedItem);
	const dataPoints = buildDataPoints(selectedItem);
	const summary = summarizeNotificationPayload(notificationType, payload);
	const detailsHeading =
		isPending || !selectedItem
			? "Alert Details"
			: `Alert Details - ${severityLabel}`;
	const actorName =
		petMatchPayload?.counterpartUser.name ||
		selectedItem?.user?.name ||
		"System";

	const detailsBody = isPending ? (
		<div role="status" aria-label="Loading alert details">
			<AlertDetailsSkeleton />
		</div>
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
						{severityLabel} Alert - {actorName}
					</span>
				</div>
				<div className="flex items-center gap-4 px-4 py-4">
					<Avatar
						user={
							petMatchPayload
								? {
										id: petMatchPayload.counterpartUser.id,
										name: actorName,

										image: petMatchPayload.counterpartUser.image,
									}
								: selectedItem.user
						}
					/>
					<div className="min-w-0">
						<p className="truncate text-lg font-semibold text-foreground">
							{actorName}
						</p>
						<div className="mt-2 text-sm text-muted">
							<span>{createdAt}</span>
						</div>
					</div>
				</div>
			</div>

			{petMatchPayload ? (
				<div className="overflow-hidden rounded border border-border bg-surface">
					<div className="grid gap-0 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
						<div className="border-b border-border bg-surface-secondary/30 md:border-b-0 md:border-r">
							{petMatchPayload.matchedAlert.imageUrl ? (
								<img
									src={normalizeAssetUrl(petMatchPayload.matchedAlert.imageUrl)}
									alt={`${petMatchPayload.matchedAlert.color} ${petMatchPayload.matchedAlert.petType}`}
									className="h-48 w-full object-cover md:h-full"
								/>
							) : (
								<div className="flex h-48 items-center justify-center text-sm text-muted">
									No photo available
								</div>
							)}
						</div>
						<div className="space-y-3 p-4">
							<div>
								<p className="text-sm text-muted">
									Matched against a {petMatchPayload.matchedAlert.alertType}{" "}
									alert
								</p>
								<p className="text-lg font-semibold text-foreground">
									{petMatchPayload.matchedAlert.color}{" "}
									{petMatchPayload.matchedAlert.petType}
								</p>
								{petMatchPayload.matchedAlert.breed ? (
									<p className="text-sm text-muted">
										{petMatchPayload.matchedAlert.breed}
									</p>
								) : null}
							</div>
							{summary ? (
								<p className="text-sm leading-relaxed text-muted">{summary}</p>
							) : null}
							{petMatchPayload.matchedAttributes.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{petMatchPayload.matchedAttributes.map((attribute) => (
										<span
											key={attribute}
											className="rounded-full border border-border px-2 py-1 text-xs text-muted"
										>
											{attribute}
										</span>
									))}
								</div>
							) : null}
						</div>
					</div>
				</div>
			) : null}

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
					{petMatchPayload
						? `Matched attributes: ${
								petMatchPayload.matchedAttributes.length > 0
									? petMatchPayload.matchedAttributes.join(", ")
									: "AI visual match"
							}`
						: isRecord(payload)
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
				) : notificationType === "PET_ALERT_MATCH" && petMatchPayload ? (
					<>
						<Button
							size="md"
							isDisabled={
								markOwnerInterested.isPending || dismissAsOwner.isPending
							}
							onPress={() => {
								markOwnerInterested.mutate(petMatchPayload.petMatchId, {
									onSuccess: () =>
										Toast.toast.success("Finder notified about your interest"),
									onError: (error: Error) =>
										Toast.toast.danger(
											error instanceof Error
												? error.message
												: "Could not confirm this match",
										),
								});
							}}
							className="border border-accent bg-surface text-accent hover:bg-accent/10"
						>
							This could be my pet
						</Button>
						<Button
							size="md"
							variant="danger-soft"
							isDisabled={
								markOwnerInterested.isPending || dismissAsOwner.isPending
							}
							onPress={() => {
								dismissAsOwner.mutate(petMatchPayload.petMatchId, {
									onSuccess: () => Toast.toast.success("Match dismissed"),
									onError: (error: Error) =>
										Toast.toast.danger(
											error instanceof Error
												? error.message
												: "Could not dismiss this match",
										),
								});
							}}
						>
							Dismiss
						</Button>
					</>
				) : notificationType === "PET_ALERT_MATCH_INTERESTED" &&
					petMatchPayload ? (
					<>
						<Button
							size="md"
							isDisabled={acceptAsFinder.isPending || declineAsFinder.isPending}
							onPress={() => {
								acceptAsFinder.mutate(petMatchPayload.petMatchId, {
									onSuccess: (result) => {
										Toast.toast.success("Chat ready");
										if (result?.conversationId) {
											navigate(`/messages/${result?.conversationId}`);
										}
									},
									onError: (error: Error) =>
										Toast.toast.danger(
											error instanceof Error
												? error.message
												: "Could not open chat",
										),
								});
							}}
							className="border border-success bg-surface text-success hover:bg-success/10"
						>
							Approve and open chat
						</Button>
						<Button
							size="md"
							variant="danger-soft"
							isDisabled={acceptAsFinder.isPending || declineAsFinder.isPending}
							onPress={() => {
								declineAsFinder.mutate(petMatchPayload.petMatchId, {
									onSuccess: () => Toast.toast.success("Match declined"),
									onError: (error: Error) =>
										Toast.toast.danger(
											error instanceof Error
												? error.message
												: "Could not decline this match",
										),
								});
							}}
						>
							Decline
						</Button>
					</>
				) : notificationType === "PET_ALERT_MATCH_ACCEPTED" &&
					petMatchPayload ? (
					<Button
						radius="md"
						className="border border-accent/60 bg-accent text-accent-foreground"
						startContent={<MessagesSquareIcon className="size-4" />}
						onPress={() => {
							if (acceptedConversationId) {
								navigate(`/messages/${acceptedConversationId}`);
								return;
							}

							ensureDirectConversation.mutate(
								petMatchPayload.counterpartUser.id,
								{
									onSuccess: (conversation) => {
										navigate(`/messages/${conversation?.id}`);
									},
									onError: (error: Error) =>
										Toast.toast.danger(
											error instanceof Error
												? error.message
												: "Could not open chat",
										),
								},
							);
						}}
						isDisabled={!petMatchPayload.counterpartUser.id}
					>
						Open Chat
					</Button>
				) : notificationType === "DOCUMENT_MATCH" && documentMatchPayload ? (
					<Button
						radius="md"
						className="border border-accent/60 bg-accent text-accent-foreground"
						startContent={<MessagesSquareIcon className="size-4" />}
						onPress={() => {
							openDocumentMatchChat.mutate(documentMatchPayload.matchId, {
								onSuccess: (result) => {
									if (result?.conversationId) {
										navigate(`/messages/${result.conversationId}`);
									}
								},
							});
						}}
						isDisabled={openDocumentMatchChat.isPending}
					>
						Open Chat
					</Button>
				) : petMatchPayload ? null : (
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
