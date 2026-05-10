import { AppDrawer } from "@client/components/AppDrawer";
import { Button } from "@client/components/Button/Button";
import { CloseIcon } from "@client/components/icons/CloseIcon";
import { H4 } from "@client/components/typography";
import {
	useAcceptPetMatchAsFinder,
	useDeclinePetMatchAsFinder,
	useDismissPetMatchAsOwner,
	useMarkPetMatchOwnerInterested,
	usePetMatchesForAlert,
} from "@client/hooks/petMatches";
import { useEnsureDirectConversation } from "@client/pages/messages/hooks";
import { normalizeAssetUrl } from "@client/utils/normalizeAssetUrl";
import {
	formatPetMatchPercent,
	isPetMatchAwaitingFinderReview,
	isPetMatchAwaitingOwnerReview,
	isPetMatchChatReady,
	type PetMatchWorkflowItem,
	petMatchStatusLabels,
} from "@client/utils/petMatches";
import { Card, Chip, ScrollShadow, Toast } from "@heroui/react";
import { MessagesSquareIcon, PawPrint } from "lucide-react";
import { useNavigate } from "react-router";

const statusToneClassName: Record<string, string> = {
	PENDING_REVIEW: "border-accent/40 bg-accent/10 text-accent",
	OWNER_INTERESTED: "border-warning/40 bg-warning/10 text-warning",
	OWNER_DISMISSED: "border-border bg-surface-secondary text-muted",
	FINDER_ACCEPTED: "border-success/40 bg-success/10 text-success",
	FINDER_DECLINED: "border-danger/40 bg-danger/10 text-danger",
};

const ReviewCard = ({
	item,
	onConfirmOwnerInterest,
	onDismiss,
	onAcceptFinder,
	onDeclineFinder,
	onOpenChat,
	isPending,
}: {
	item: PetMatchWorkflowItem;
	onConfirmOwnerInterest: (petMatchId: string) => void;
	onDismiss: (petMatchId: string) => void;
	onAcceptFinder: (petMatchId: string) => void;
	onDeclineFinder: (petMatchId: string) => void;
	onOpenChat: (item: PetMatchWorkflowItem) => void;
	isPending: boolean;
}) => {
	const showOwnerReview = isPetMatchAwaitingOwnerReview(item);
	const showFinderReview = isPetMatchAwaitingFinderReview(item);
	const showOpenChat = isPetMatchChatReady(item);

	return (
		<Card className="overflow-hidden border border-border bg-surface shadow-none">
			<div className="grid gap-0 md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
				<div className="border-b border-border bg-surface-secondary/20 md:border-b-0 md:border-r">
					{item.matchedAlert.imageUrl ? (
						<img
							src={normalizeAssetUrl(item.matchedAlert.imageUrl)}
							alt={`${item.matchedAlert.color} ${item.matchedAlert.petType}`}
							className="h-40 w-full object-cover sm:h-44 md:h-full"
						/>
					) : (
						<div className="flex h-44 items-center justify-center text-sm text-muted">
							No photo available
						</div>
					)}
				</div>
				<div className="space-y-4 p-4 sm:p-5">
					<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
						<div className="space-y-1">
							<p className="text-xs uppercase tracking-[0.16em] text-muted">
								Matched alert
							</p>
							<h3 className="text-lg font-semibold text-foreground">
								{item.matchedAlert.color} {item.matchedAlert.petType}
							</h3>
							<p className="text-sm text-muted">
								{item.counterpartUser.name || "Neighbor"}
								{" · "}
								{item.matchedAlert.alertType}
							</p>
						</div>
						<Chip
							size="sm"
							className={`max-w-full self-start rounded-full border px-2 py-1 ${statusToneClassName[item.petMatch.status]}`}
						>
							{petMatchStatusLabels[item.petMatch.status]}
						</Chip>
					</div>

					<div className="grid gap-2 sm:grid-cols-3">
						<div className="rounded border border-border bg-surface-secondary/20 px-3 py-2">
							<p className="text-xs text-muted">Confidence</p>
							<p className="text-sm font-medium text-foreground">
								{formatPetMatchPercent(item.petMatch.confidenceScore)}
							</p>
						</div>
						<div className="rounded border border-border bg-surface-secondary/20 px-3 py-2">
							<p className="text-xs text-muted">Image match</p>
							<p className="text-sm font-medium text-foreground">
								{formatPetMatchPercent(item.petMatch.imageSimilarity)}
							</p>
						</div>
						<div className="rounded border border-border bg-surface-secondary/20 px-3 py-2">
							<p className="text-xs text-muted">Alert type</p>
							<p className="text-sm font-medium capitalize text-foreground">
								{item.baseAlert.alertType}
							</p>
						</div>
					</div>

					{item.petMatch.matchedAttributes.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{item.petMatch.matchedAttributes.map((attribute) => (
								<Chip
									key={attribute}
									size="sm"
									className="rounded-full border border-border bg-surface-secondary/20 text-muted"
								>
									{attribute}
								</Chip>
							))}
						</div>
					) : null}

					<div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
						{showOwnerReview ? (
							<>
								<Button
									size="sm"
									isDisabled={isPending}
									className="w-full border border-accent bg-surface text-accent hover:bg-accent/10 sm:w-auto"
									onPress={() => onConfirmOwnerInterest(item.petMatch.id)}
								>
									This could be my pet
								</Button>
								<Button
									size="sm"
									variant="danger-soft"
									isDisabled={isPending}
									className="w-full sm:w-auto"
									onPress={() => onDismiss(item.petMatch.id)}
								>
									Dismiss
								</Button>
							</>
						) : null}

						{showFinderReview ? (
							<>
								<Button
									size="sm"
									isDisabled={isPending}
									className="w-full border border-success bg-surface text-success hover:bg-success/10 sm:w-auto"
									onPress={() => onAcceptFinder(item.petMatch.id)}
								>
									Approve and open chat
								</Button>
								<Button
									size="sm"
									variant="danger-soft"
									isDisabled={isPending}
									className="w-full sm:w-auto"
									onPress={() => onDeclineFinder(item.petMatch.id)}
								>
									Decline
								</Button>
							</>
						) : null}

						{showOpenChat ? (
							<Button
								size="sm"
								isDisabled={isPending}
								startContent={<MessagesSquareIcon className="size-4" />}
								className="w-full border border-accent bg-accent text-accent-foreground sm:w-auto"
								onPress={() => onOpenChat(item)}
							>
								Open chat
							</Button>
						) : null}
					</div>
				</div>
			</div>
		</Card>
	);
};

export const PetMatchReviewDrawer = ({
	petAlertId,
	ownerLabel,
	isOpen,
	onClose,
}: {
	petAlertId: string | null;
	ownerLabel: string;
	isOpen: boolean;
	onClose: () => void;
}) => {
	const navigate = useNavigate();
	const { data: items = [], isPending } = usePetMatchesForAlert(petAlertId);
	const ownerInterested = useMarkPetMatchOwnerInterested();
	const dismissAsOwner = useDismissPetMatchAsOwner();
	const acceptAsFinder = useAcceptPetMatchAsFinder();
	const declineAsFinder = useDeclinePetMatchAsFinder();
	const ensureDirectConversation = useEnsureDirectConversation();

	const isActionPending =
		ownerInterested.isPending ||
		dismissAsOwner.isPending ||
		acceptAsFinder.isPending ||
		declineAsFinder.isPending ||
		ensureDirectConversation.isPending;

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
				<div className="border-b border-border px-4 py-4 sm:px-5">
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-2 text-accent">
							<PawPrint className="size-5" />
							<div>
								<H4>Review Matches</H4>
								<p className="text-sm text-muted">{ownerLabel}</p>
							</div>
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
				className="h-full overflow-y-auto px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5"
			>
				<div className="space-y-4">
					{isPending ? (
						<div className="rounded border border-border bg-surface-secondary/25 p-6 text-sm text-muted">
							Loading pet matches...
						</div>
					) : items.length === 0 ? (
						<div className="rounded border border-border bg-surface-secondary/25 p-6 text-sm text-muted">
							No reviewable matches yet for this alert.
						</div>
					) : (
						items.map((item) => (
							<ReviewCard
								key={item.petMatch.id}
								item={item}
								isPending={isActionPending}
								onConfirmOwnerInterest={(petMatchId) => {
									ownerInterested.mutate(petMatchId, {
										onSuccess: () =>
											Toast.toast.success(
												"The finder has been notified about your interest",
											),
										onError: (error: Error) =>
											Toast.toast.danger(
												error instanceof Error
													? error.message
													: "Could not confirm this match",
											),
									});
								}}
								onDismiss={(petMatchId) => {
									dismissAsOwner.mutate(petMatchId, {
										onSuccess: () => Toast.toast.success("Match dismissed"),
										onError: (error: Error) =>
											Toast.toast.danger(
												error instanceof Error
													? error.message
													: "Could not dismiss this match",
											),
									});
								}}
								onAcceptFinder={(petMatchId) => {
									acceptAsFinder.mutate(petMatchId, {
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
								onDeclineFinder={(petMatchId) => {
									declineAsFinder.mutate(petMatchId, {
										onSuccess: () => Toast.toast.success("Match declined"),
										onError: (error: Error) =>
											Toast.toast.danger(
												error instanceof Error
													? error.message
													: "Could not decline this match",
											),
									});
								}}
								onOpenChat={(item) => {
									ensureDirectConversation.mutate(item.counterpartUser.id, {
										onSuccess: (conversation) => {
											navigate(`/messages/${conversation?.id}`);
										},
										onError: (error: Error) =>
											Toast.toast.danger(
												error instanceof Error
													? error.message
													: "Could not open chat",
											),
									});
								}}
							/>
						))
					)}
				</div>
			</ScrollShadow>
		</AppDrawer>
	);
};
