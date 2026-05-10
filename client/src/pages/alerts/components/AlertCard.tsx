import { Button } from "@client/components/Button/Button";
import { HelpIcon } from "@client/components/icons/HelpIcon";
import { Avatar } from "@client/components/user/Avatar";
import { useOpenDocumentMatchChat } from "@client/hooks/documentMatches";
import {
	useAcceptPetMatchAsFinder,
	useDeclinePetMatchAsFinder,
	useDismissPetMatchAsOwner,
	useMarkPetMatchOwnerInterested,
} from "@client/hooks/petMatches";
import {
	useAcceptHelpOffer,
	useRejectHelpOffer,
} from "@client/pages/map/hooks";
import { useEnsureDirectConversation } from "@client/pages/messages/hooks";
import {
	getDocumentMatchNotificationPayload,
	getPetMatchNotificationPayload,
	getPulseResponseActionPayload,
	labelForNotificationType,
	type NotificationListItem,
	summarizeNotificationPayload,
} from "@client/utils/notifications";
import { Chip, cn, Toast } from "@heroui/react";
import { formatDate } from "@shared/utils/formatDate";
import { BellDot, MessagesSquareIcon } from "lucide-react";
import { useNavigate } from "react-router";

export const AlertCard = ({
	notificationItem,
	isActive = false,
}: {
	notificationItem: NotificationListItem;
	isActive?: boolean;
}) => {
	const navigate = useNavigate();
	const { mutateAsync: acceptHelp, isPending: isAcceptPending } =
		useAcceptHelpOffer();
	const { mutateAsync: rejectHelp, isPending: isRejectPending } =
		useRejectHelpOffer();
	const {
		mutateAsync: markOwnerInterested,
		isPending: markOwnerInterestedPending,
	} = useMarkPetMatchOwnerInterested();
	const { mutateAsync: dismissAsOwner, isPending: isDismissPending } =
		useDismissPetMatchAsOwner();
	const { mutateAsync: acceptAsFinder, isPending: isAcceptAsFinderPending } =
		useAcceptPetMatchAsFinder();
	const { mutateAsync: declineAsFinder, isPending: isDeclineAsFinderPending } =
		useDeclinePetMatchAsFinder();
	const {
		mutateAsync: ensureDirectConversation,
		isPending: isEnsureDirectPending,
	} = useEnsureDirectConversation();
	const {
		mutateAsync: openDocumentMatchChat,
		isPending: isDocumentChatPending,
	} = useOpenDocumentMatchChat();

	const notificationType = notificationItem.notification?.type || "";
	const payload = notificationItem.notification?.payload ?? null;
	const pulseResponsePayload = getPulseResponseActionPayload(
		notificationType === "PULSE_RESPONSE" ? payload : null,
	);
	const createdAt = notificationItem.notification?.createdAt
		? new Date(notificationItem.notification.createdAt).toLocaleString()
		: "Unknown time";
	const petMatchPayload = getPetMatchNotificationPayload(
		notificationType,
		payload,
	);
	const documentMatchPayload = getDocumentMatchNotificationPayload(
		notificationType,
		payload,
	);

	const isActionPending =
		isAcceptPending ||
		isRejectPending ||
		markOwnerInterestedPending ||
		isDismissPending ||
		isAcceptAsFinderPending ||
		isDeclineAsFinderPending ||
		isEnsureDirectPending ||
		isDocumentChatPending;

	const alertType =
		typeof payload?.type === "string"
			? payload.type
			: labelForNotificationType(notificationType);
	const summary = summarizeNotificationPayload(notificationType, payload);
	const actorName =
		petMatchPayload?.counterpartUser.name ||
		notificationItem.user?.name ||
		"System alert";

	const cardContent = (
		<div className="flex items-start gap-3">
			<Avatar
				user={
					petMatchPayload
						? {
								id: petMatchPayload.counterpartUser.id,
								name: actorName,

								image: petMatchPayload.counterpartUser.image,
							}
						: notificationItem.user
				}
			/>

			<div className="min-w-0 flex-1 space-y-3">
				<div className="flex min-w-0 items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="truncate text-md font-semibold text-accent">
							{actorName}
						</p>
					</div>

					<div className="shrink-0 text-right text-xs text-muted">
						<span>{formatDate(createdAt)}</span>
					</div>
				</div>

				<div className="flex items-center gap-2 text-sm text-foreground">
					<Chip className="rounded-full border border-accent bg-accent/10 p-1">
						<Chip.Label className="flex items-center justify-center gap-1">
							{pulseResponsePayload ? (
								<HelpIcon className="size-4 text-accent" />
							) : (
								<BellDot className="size-4 text-accent" />
							)}
							<span className="text-xs font-semibold text-accent">
								{alertType}
							</span>
						</Chip.Label>
					</Chip>
				</div>

				{summary ? (
					<p className="text-sm leading-relaxed text-muted">{summary}</p>
				) : null}
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
						onPress={async () => {
							const res = await acceptHelp(pulseResponsePayload);
							if (res) {
								Toast.toast.success("Help offer accepted");
							}
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
						onPress={async () => {
							const res = await rejectHelp(pulseResponsePayload);
							if (res) {
								Toast.toast.success("Help offer rejected");
							}
						}}
					>
						Reject
					</Button>
				</div>
			) : notificationType === "PET_ALERT_MATCH" && petMatchPayload ? (
				<div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
					<Button
						radius="md"
						size="sm"
						isDisabled={isActionPending}
						onPress={async () => {
							const res = await markOwnerInterested(petMatchPayload.petMatchId);
							if (res) {
								Toast.toast.success("Interest marked");
							}
						}}
						className="border border-accent bg-surface px-3 text-accent transition-colors duration-150 ease-out hover:bg-accent/10"
					>
						This could be my pet
					</Button>
					<Button
						variant="danger-soft"
						radius="md"
						size="sm"
						isDisabled={isActionPending}
						onPress={async () => {
							const res = await dismissAsOwner(petMatchPayload.petMatchId);
							if (res) {
								Toast.toast.success("Match dismissed");
							}
						}}
					>
						Dismiss
					</Button>
				</div>
			) : notificationType === "PET_ALERT_MATCH_INTERESTED" &&
				petMatchPayload ? (
				<div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
					<Button
						radius="md"
						size="sm"
						isDisabled={isActionPending}
						onPress={async () => {
							const result = await acceptAsFinder(petMatchPayload.petMatchId);
							if (result) {
								Toast.toast.success("Chat ready");
								if (result.conversationId) {
									navigate(`/messages/${result.conversationId}`);
								}
							}
						}}
						className="border border-success bg-surface px-3 text-success transition-colors duration-150 ease-out hover:bg-success/10"
					>
						Approve and open chat
					</Button>
					<Button
						variant="danger-soft"
						radius="md"
						size="sm"
						isDisabled={isActionPending}
						onPress={async () => {
							const res = await declineAsFinder(petMatchPayload.petMatchId);
							if (res) {
								Toast.toast.success("Match declined");
							}
						}}
					>
						Decline
					</Button>
				</div>
			) : notificationType === "PET_ALERT_MATCH_ACCEPTED" && petMatchPayload ? (
				<div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
					<Button
						radius="md"
						size="sm"
						isDisabled={isActionPending}
						startContent={<MessagesSquareIcon className="size-4" />}
						className="border border-accent bg-accent text-accent-foreground"
						onPress={async () => {
							if (petMatchPayload.conversationId) {
								navigate(`/messages/${petMatchPayload.conversationId}`);
								return;
							}

							const conversation = await ensureDirectConversation(
								petMatchPayload.counterpartUser.id,
							);
							if (conversation) {
								navigate(`/messages/${conversation.id}`);
							}
						}}
					>
						Open chat
					</Button>
				</div>
			) : notificationType === "DOCUMENT_MATCH" && documentMatchPayload ? (
				<div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
					<Button
						radius="md"
						size="sm"
						isDisabled={isActionPending}
						startContent={<MessagesSquareIcon className="size-4" />}
						className="border border-accent bg-accent text-accent-foreground"
						onPress={async () => {
							const result = await openDocumentMatchChat(
								documentMatchPayload.matchId,
							);
							if (result?.conversationId) {
								navigate(`/messages/${result.conversationId}`);
							}
						}}
					>
						Open chat
					</Button>
				</div>
			) : null}
		</article>
	);
};
