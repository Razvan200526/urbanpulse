import { Button } from "@client/components/Button/Button";
import { HelpIcon } from "@client/components/icons/HelpIcon";
import { Avatar } from "@client/components/user/Avatar";
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
	getPetMatchNotificationPayload,
	getPulseResponseActionPayload,
	labelForNotificationType,
	type NotificationListItem,
	summarizeNotificationPayload,
} from "@client/utils/notifications";
import { Chip, cn, Toast } from "@heroui/react";
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
	const acceptHelp = useAcceptHelpOffer();
	const rejectHelp = useRejectHelpOffer();
	const markOwnerInterested = useMarkPetMatchOwnerInterested();
	const dismissAsOwner = useDismissPetMatchAsOwner();
	const acceptAsFinder = useAcceptPetMatchAsFinder();
	const declineAsFinder = useDeclinePetMatchAsFinder();
	const ensureDirectConversation = useEnsureDirectConversation();

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
	const isActionPending =
		acceptHelp.isPending ||
		rejectHelp.isPending ||
		markOwnerInterested.isPending ||
		dismissAsOwner.isPending ||
		acceptAsFinder.isPending ||
		declineAsFinder.isPending ||
		ensureDirectConversation.isPending;
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
								email: petMatchPayload.counterpartUser.email || "",
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
			) : notificationType === "PET_ALERT_MATCH" && petMatchPayload ? (
				<div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
					<Button
						radius="md"
						size="sm"
						isDisabled={isActionPending}
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
						className="border border-accent bg-surface px-3 text-accent transition-colors duration-150 ease-out hover:bg-accent/10"
					>
						This could be my pet
					</Button>
					<Button
						variant="danger-soft"
						radius="md"
						size="sm"
						isDisabled={isActionPending}
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
				</div>
			) : notificationType === "PET_ALERT_MATCH_INTERESTED" &&
				petMatchPayload ? (
				<div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
					<Button
						radius="md"
						size="sm"
						isDisabled={isActionPending}
						onPress={() => {
							acceptAsFinder.mutate(petMatchPayload.petMatchId, {
								onSuccess: (result) => {
									Toast.toast.success("Chat ready");
									if (result.conversationId) {
										navigate(`/messages/${result.conversationId}`);
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
						className="border border-success bg-surface px-3 text-success transition-colors duration-150 ease-out hover:bg-success/10"
					>
						Approve and open chat
					</Button>
					<Button
						variant="danger-soft"
						radius="md"
						size="sm"
						isDisabled={isActionPending}
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
				</div>
			) : notificationType === "PET_ALERT_MATCH_ACCEPTED" && petMatchPayload ? (
				<div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
					<Button
						radius="md"
						size="sm"
						isDisabled={isActionPending}
						startContent={<MessagesSquareIcon className="size-4" />}
						className="border border-accent bg-accent text-accent-foreground"
						onPress={() => {
							if (petMatchPayload.conversationId) {
								navigate(`/messages/${petMatchPayload.conversationId}`);
								return;
							}

							ensureDirectConversation.mutate(
								petMatchPayload.counterpartUser.id,
								{
									onSuccess: (conversation) => {
										navigate(`/messages/${conversation.id}`);
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
					>
						Open chat
					</Button>
				</div>
			) : null}
		</article>
	);
};
