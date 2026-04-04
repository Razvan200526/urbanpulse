import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { PageLoader } from "@client/components/PageLoader";
import { H4 } from "@client/components/typography";
import { Avatar } from "@client/components/user/Avatar";
import { useAuth } from "@client/hooks/useAuth";
import {
	Avatar as HeroAvatar,
	ScrollShadow,
	Separator,
	Toast,
} from "@heroui/react";
import { MessagesSquareIcon, SendHorizonal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
	type ConversationSummary,
	useConversationList,
	useConversationThread,
	useSendConversationMessage,
} from "./hooks";

function conversationTitle(
	conversation: ConversationSummary,
	currentUserId: string | undefined,
) {
	const otherMembers = conversation.members.filter(
		(member) => member.id !== currentUserId,
	);

	if (conversation.conversation.type === "PULSE") {
		return otherMembers.map((member) => member.name).join(", ") || "Pulse team";
	}

	return otherMembers[0]?.name || "Direct conversation";
}

export const MessagesPage = () => {
	const { data: auth } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const { data: conversations, isPending } = useConversationList();
	const selectedConversationId = searchParams.get("conversationId");
	const { data: thread, isPending: isThreadPending } = useConversationThread(
		selectedConversationId,
	);
	const { mutateAsync: sendMessage, isPending: isSending } =
		useSendConversationMessage();
	const [draft, setDraft] = useState("");

	const selectedConversation = useMemo(
		() =>
			(conversations ?? []).find(
				(item) => item.conversation.id === selectedConversationId,
			) ?? null,
		[conversations, selectedConversationId],
	);

	useEffect(() => {
		if (!selectedConversationId && conversations && conversations.length > 0) {
			setSearchParams({ conversationId: conversations[0].conversation.id });
		}
	}, [conversations, selectedConversationId, setSearchParams]);

	const handleSend = async () => {
		if (!selectedConversationId || !draft.trim()) {
			return;
		}

		try {
			await sendMessage({
				conversationId: selectedConversationId,
				content: draft.trim(),
			});
			setDraft("");
		} catch (error) {
			Toast.toast.danger(
				error instanceof Error ? error.message : "Failed to send message",
			);
		}
	};

	if (isPending) {
		return <PageLoader />;
	}

	return (
		<div className="flex h-[calc(100dvh)] w-full flex-col bg-surface">
			<Header title="Messages" />
			<Separator />
			<div className="grid min-h-0 flex-1 gap-4 p-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
				<div className="min-h-0 overflow-hidden rounded-lg border border-border bg-surface">
					<div className="flex items-center gap-2 justify-start border-b border-border px-4 py-4">
						<MessagesSquareIcon className="text-accent" />
						<H4>Your DM's</H4>
					</div>
					<ScrollShadow
						hideScrollBar
						className="h-full max-h-[calc(100dvh-11rem)] p-2"
						size={8}
					>
						{!conversations || conversations.length === 0 ? (
							<div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-border px-4 text-sm text-muted">
								No conversations yet. Accepted helpers and direct outreach will
								show up here.
							</div>
						) : (
							<div className="space-y-2">
								{conversations.map((conversation) => {
									const active =
										conversation.conversation.id === selectedConversationId;
									const lastMessage = conversation.lastMessage?.content;
									return (
										<button
											key={conversation.conversation.id}
											type="button"
											onClick={() =>
												setSearchParams({
													conversationId: conversation.conversation.id,
												})
											}
											className={`cursor-pointer w-full rounded border px-3 py-3 text-left transition-colors duration-150 ease-out${
												active
													? "border-accent bg-accent/5"
													: "border-border bg-surface hover:bg-surface-secondary hover:border-accent"
											}`}
										>
											<div className="flex items-center justify-between gap-3">
												<div className="min-w-0 flex items-center justify-start gap-2">
													<HeroAvatar size="sm">
														<HeroAvatar.Image src={auth?.user.image || ""} />
													</HeroAvatar>
													<p className="truncate text-sm text-accent">
														{auth?.user.name}
													</p>
												</div>
											</div>
											<p className="mt-3 truncate text-sm text-muted">
												{lastMessage || "No messages yet"}
											</p>
										</button>
									);
								})}
							</div>
						)}
					</ScrollShadow>
				</div>

				<div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
					{!selectedConversationId || !selectedConversation ? (
						<div className="flex h-full items-center justify-center px-6 text-sm text-muted">
							Select a conversation to start coordinating.
						</div>
					) : isThreadPending || !thread ? (
						<div className="flex h-full items-center justify-center px-6 text-sm text-muted">
							Loading conversation…
						</div>
					) : (
						<>
							<div className="border-b border-border px-4 py-4">
								<H4 className="text-base font-semibold text-foreground">
									{conversationTitle(selectedConversation, auth?.user.id)}
								</H4>
								<p className="mt-1 text-sm text-muted">
									{thread.conversation.type === "PULSE"
										? "Pulse coordination thread"
										: "Direct conversation"}
								</p>
							</div>

							<ScrollShadow className="flex-1 px-4 py-4" size={8}>
								<div className="space-y-3">
									{thread.messages.length === 0 ? (
										<div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-border px-4 text-sm text-muted">
											No messages yet. Start the coordination thread here.
										</div>
									) : (
										thread.messages.map((entry) => {
											const isOwn = entry.senderId === auth?.user.id;
											return (
												<div
													key={entry.id}
													className={`flex gap-3 ${
														isOwn ? "justify-end" : "justify-start"
													}`}
												>
													{!isOwn && <Avatar user={entry.sender} />}
													<div
														className={`max-w-xl rounded-2xl px-4 py-3 ${
															isOwn
																? "bg-accent text-white"
																: "bg-surface-secondary/55 text-foreground"
														}`}
													>
														<p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
															{isOwn ? "You" : entry.sender?.name || "Neighbor"}
														</p>
														<p className="mt-2 whitespace-pre-wrap text-sm">
															{entry.content}
														</p>
														<p className="mt-2 text-[11px] opacity-75">
															{new Date(entry.sentAt).toLocaleString()}
														</p>
													</div>
												</div>
											);
										})
									)}
								</div>
							</ScrollShadow>

							<div className="border-t border-border p-4">
								<div className="flex gap-3">
									<textarea
										value={draft}
										onChange={(event) => setDraft(event.target.value)}
										placeholder="Write a secure logistics message…"
										className="min-h-24 flex-1 rounded-lg border border-border bg-surface px-3 py-3 text-sm outline-none"
									/>
									<Button
										variant="primary"
										onPress={handleSend}
										isPending={isSending}
										isDisabled={!draft.trim()}
										startContent={<SendHorizonal className="size-4" />}
									>
										Send
									</Button>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};
