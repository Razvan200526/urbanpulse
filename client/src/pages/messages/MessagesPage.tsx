import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { PageLoader } from "@client/components/PageLoader";
import { H4 } from "@client/components/typography";
import { Avatar } from "@client/components/user/Avatar";
import { useAuth } from "@client/hooks/useAuth";
import { useIsMobile } from "@client/hooks/useMediaQuery";
import { ScrollShadow, Separator, Toast } from "@heroui/react";
import { ArrowLeft, MessagesSquareIcon, SendHorizonal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
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

function conversationOtherMember(
	conversation: ConversationSummary,
	currentUserId: string | undefined,
) {
	const otherMembers = conversation.members.filter(
		(member) => member.id !== currentUserId,
	);

	return otherMembers[0] ?? conversation.members[0] ?? null;
}

export const MessagesPage = () => {
	const { data: auth } = useAuth();
	const isMobile = useIsMobile();
	const navigate = useNavigate();
	const { conversationId } = useParams();
	const { data: conversations, isPending } = useConversationList();
	const effectiveConversationId = useMemo(() => {
		if (conversationId) {
			return conversationId;
		}

		if (!isMobile && conversations && conversations.length > 0) {
			return conversations[0].conversation.id;
		}

		return null;
	}, [conversationId, conversations, isMobile]);
	const { data: thread, isPending: isThreadPending } = useConversationThread(
		effectiveConversationId,
	);
	const { mutateAsync: sendMessage, isPending: isSending } =
		useSendConversationMessage();
	const [draft, setDraft] = useState("");

	const selectedConversation = useMemo(
		() =>
			(conversations ?? []).find(
				(item) => item.conversation.id === effectiveConversationId,
			) ?? null,
		[conversations, effectiveConversationId],
	);

	useEffect(() => {
		setDraft("");
	}, []);

	const openConversation = (conversationId: string) => {
		navigate(`/messages/${conversationId}`);
	};

	const closeConversation = () => {
		navigate("/messages");
	};

	const handleSend = async () => {
		if (!effectiveConversationId || !draft.trim()) {
			return;
		}

		try {
			await sendMessage({
				conversationId: effectiveConversationId,
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

	const renderConversationList = () => {
		if (!conversations || conversations.length === 0) {
			return (
				<div className="flex h-full items-center justify-center px-6 text-sm text-muted">
					It&apos;s empty here.
				</div>
			);
		}

		return (
			<div className="space-y-1.5 p-2">
				{conversations.map((conversation) => {
					const active =
						conversation.conversation.id === effectiveConversationId;
					const lastMessage = conversation.lastMessage?.content;
					const otherMember = conversationOtherMember(
						conversation,
						auth?.user.id,
					);
					const title = conversationTitle(conversation, auth?.user.id);

					return (
						<button
							key={conversation.conversation.id}
							type="button"
							onClick={() => openConversation(conversation.conversation.id)}
							className={`w-full rounded-sm border px-3 py-3 text-left transition-colors ${
								active
									? "border-accent bg-surface-secondary"
									: "border-transparent bg-surface hover:border-border hover:bg-surface-secondary"
							}`}
						>
							<div className="flex items-start gap-3">
								<div className="shrink-0 pt-0.5">
									<Avatar user={otherMember} />
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-3">
										<p className="truncate text-sm font-semibold text-foreground">
											{title}
										</p>
										{conversation.lastMessage?.sentAt ? (
											<p className="shrink-0 text-xs text-muted">
												{new Date(
													conversation.lastMessage.sentAt,
												).toLocaleDateString()}
											</p>
										) : null}
									</div>
									<p className="mt-1 truncate text-sm text-muted">
										{lastMessage || "No messages yet"}
									</p>
								</div>
							</div>
						</button>
					);
				})}
			</div>
		);
	};

	const renderThreadContent = () => {
		if (!effectiveConversationId || !selectedConversation) {
			return (
				<div className="flex h-full items-center justify-center px-6 text-sm text-muted">
					Select a conversation to start coordinating.
				</div>
			);
		}

		if (isThreadPending || !thread) {
			return (
				<div className="flex h-full items-center justify-center px-6 text-sm text-muted">
					Loading conversation…
				</div>
			);
		}

		return (
			<>
				<div className="border-b border-border px-4 py-4">
					<div className="flex items-center gap-3">
						{isMobile ? (
							<Button
								variant="ghost"
								size="sm"
								onPress={closeConversation}
								startContent={<ArrowLeft className="size-4" />}
							>
								Back
							</Button>
						) : null}
						<div className="min-w-0">
							<H4 className="truncate text-base font-semibold text-foreground">
								{conversationTitle(selectedConversation, auth?.user.id)}
							</H4>
							<p className="mt-1 text-sm text-muted">
								{thread.conversation.type === "PULSE"
									? "Pulse coordination thread"
									: "Direct conversation"}
							</p>
						</div>
					</div>
				</div>

				<ScrollShadow className="flex-1 px-4 py-4" size={8}>
					<div className="space-y-3">
						{thread.messages.length === 0 ? (
							<div className="flex min-h-56 items-center justify-center rounded-sm border border-dashed border-border px-4 text-sm text-muted">
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
											className={`max-w-[85%] rounded px-4 py-3 sm:max-w-xl ${
												isOwn
													? "bg-accent text-white"
													: "bg-surface-secondary text-foreground"
											}`}
										>
											<p className="text-xs font-medium opacity-80">
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
					<div className="flex flex-col gap-3 sm:flex-row">
						<textarea
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							placeholder="Write a secure logistics message…"
							className="min-h-20 flex-1 rounded-sm border border-border bg-surface px-3 py-3 text-sm outline-none transition-colors focus:border-accent"
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
		);
	};

	return (
		<div className="flex h-[calc(100dvh)] w-full flex-col bg-surface">
			<Header title="Messages" />
			<Separator />
			{isMobile ? (
				<div className="min-h-0 flex-1 p-4">
					{effectiveConversationId ? (
						<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-sm border border-border bg-surface">
							{renderThreadContent()}
						</div>
					) : (
						<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-sm border border-border bg-surface">
							<div className="flex items-center gap-2 border-b border-border px-4 py-4">
								<MessagesSquareIcon className="size-4 text-accent" />
								<H4>Your messages</H4>
							</div>
							<ScrollShadow hideScrollBar className="min-h-0 flex-1" size={8}>
								{renderConversationList()}
							</ScrollShadow>
						</div>
					)}
				</div>
			) : (
				<div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
					<div className="min-h-0 overflow-hidden rounded-sm border border-border bg-surface">
						<div className="flex items-center gap-2 border-b border-border px-4 py-4">
							<MessagesSquareIcon className="size-4 text-accent" />
							<H4>Your messages</H4>
						</div>
						<ScrollShadow hideScrollBar className="min-h-0 h-full" size={8}>
							{renderConversationList()}
						</ScrollShadow>
					</div>

					<div className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border bg-surface">
						{renderThreadContent()}
					</div>
				</div>
			)}
		</div>
	);
};
