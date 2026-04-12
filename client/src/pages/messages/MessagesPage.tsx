import { Header } from "@client/components/Header";
import { useAuth } from "@client/hooks/useAuth";
import { useIsMobile } from "@client/hooks/useMediaQuery";
import { Separator, Toast } from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ConversationList } from "./components/ConversationList";
import { ConversationListSkeleton } from "./components/ConversationListSkeleton";
import { ConversationThread } from "./components/ConversationThread";
import { ConversationThreadSkeleton } from "./components/ConversationThreadSkeleton";
import {
	type ConversationMemberView,
	sendConversationTypingState,
	useConversationList,
	useConversationThread,
	useMessageSocketEvents,
	useSendConversationMessage,
} from "./hooks";

export const MessagesPage = () => {
	const { data: auth } = useAuth();
	const isMobile = useIsMobile();
	const navigate = useNavigate();
	const { conversationId } = useParams<{ conversationId: string }>();
	const { data: conversations, isPending } = useConversationList();
	const effectiveConversationId = conversationId ?? null;
	const selectedConversation =
		conversations?.find(
			(item) => item.conversation.id === effectiveConversationId,
		) ?? null;
	const { data: thread, isPending: isThreadPending } = useConversationThread(
		effectiveConversationId,
	);
	const { mutateAsync: sendMessage, isPending: isSending } =
		useSendConversationMessage();
	const [draft, setDraft] = useState("");
	const { typingUserIds } = useMessageSocketEvents({
		conversationId: effectiveConversationId,
		currentUserId: auth?.user.id,
	});
	const typingResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isTypingRef = useRef(false);
	const typingConversationRef = useRef<string | null>(null);

	const typingMembers = useMemo(() => {
		if (!thread) {
			return [];
		}

		return typingUserIds
			.map((userId) => thread.members.find((member) => member.id === userId))
			.filter((member): member is ConversationMemberView => Boolean(member));
	}, [thread, typingUserIds]);

	const stopTyping = useCallback(
		(conversationId = typingConversationRef.current) => {
			if (typingResetRef.current) {
				clearTimeout(typingResetRef.current);
				typingResetRef.current = null;
			}

			if (!conversationId || !isTypingRef.current) {
				return;
			}

			sendConversationTypingState(conversationId, false);
			isTypingRef.current = false;
			typingConversationRef.current = null;
		},
		[],
	);

	useEffect(() => {
		stopTyping();
		setDraft("");
	}, [stopTyping]);

	useEffect(() => {
		return () => stopTyping();
	}, [stopTyping]);

	useEffect(() => {
		if (isMobile || conversationId || !conversations?.length) {
			return;
		}

		navigate(`/messages/${conversations[0].conversation.id}`, {
			replace: true,
		});
	}, [conversationId, conversations, isMobile, navigate]);

	const closeConversation = () => {
		navigate("/messages");
	};

	const handleSend = async (message = draft) => {
		const content = message.trim();

		if (!effectiveConversationId || !content) {
			return;
		}

		try {
			stopTyping();
			await sendMessage({
				conversationId: effectiveConversationId,
				content,
			});
			setDraft("");
		} catch (error) {
			Toast.toast.danger(
				error instanceof Error ? error.message : "Failed to send message",
			);
		}
	};

	const handleDraftChange = (value: string) => {
		setDraft(value);

		if (!effectiveConversationId) {
			return;
		}

		if (!value.trim()) {
			stopTyping();
			return;
		}

		if (
			!isTypingRef.current ||
			typingConversationRef.current !== effectiveConversationId
		) {
			stopTyping();
			sendConversationTypingState(effectiveConversationId, true);
			isTypingRef.current = true;
			typingConversationRef.current = effectiveConversationId;
		}

		if (typingResetRef.current) {
			clearTimeout(typingResetRef.current);
		}

		typingResetRef.current = setTimeout(() => {
			stopTyping(effectiveConversationId);
		}, 1500);
	};

	const conversationList = (
		isPending ? (
			<ConversationListSkeleton />
		) : (
			<ConversationList
				activeConversationId={effectiveConversationId}
				conversations={conversations}
				currentUserId={auth?.user.id}
			/>
		)
	);

	const conversationThread = (
		isPending || (Boolean(effectiveConversationId) && isThreadPending) ? (
			<ConversationThreadSkeleton
				showBackButton={Boolean(isMobile && effectiveConversationId)}
			/>
		) : (
			<ConversationThread
				composer={{
					draft,
					isSending,
					onDraftChange: handleDraftChange,
					onSend: handleSend,
				}}
				conversation={thread ?? selectedConversation}
				conversationId={effectiveConversationId}
				currentUserId={auth?.user.id}
				thread={thread}
				typingMembers={typingMembers}
				onBack={closeConversation}
			/>
		)
	);

	return (
		<div className="flex h-[calc(100dvh)] w-full flex-col bg-surface">
			<Header title="Messages" />
			<Separator />
			{isMobile ? (
				<div className="min-h-0 flex-1 p-4">
					{effectiveConversationId ? (
						<div className="flex h-full min-h-0 flex-col overflow-hidden rounded border border-border bg-surface">
							{conversationThread}
						</div>
					) : (
						<div className="flex h-full min-h-0 flex-col overflow-hidden rounded border border-border bg-surface">
							{conversationList}
						</div>
					)}
				</div>
			) : (
				<div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
					<div className="min-h-0 overflow-hidden rounded border border-border bg-surface">
						{conversationList}
					</div>

					<div className="flex min-h-0 flex-col overflow-hidden rounded border border-border bg-surface">
						{conversationThread}
					</div>
				</div>
			)}
		</div>
	);
};
