import { Button } from "@client/components/Button/Button";
import { ChevronRightIcon } from "@client/components/icons/ChevronRight";
import {
	InputMessage,
	type InputMessageRefType,
} from "@client/components/input/InputMessage";
import { cn, ScrollShadow } from "@heroui/react";
import { Skeleton } from "boneyard-js/react";
import { useRef } from "react";
import type {
	ConversationMemberView,
	ConversationSummary,
	ConversationThread as ConversationThreadType,
} from "../hooks";
import { Message } from "./Message";

export const ConversationThread = ({
	conversationId,
	currentUserId,
	draft,
	isMobile,
	isSending,
	isThreadPending,
	selectedConversation,
	thread,
	typingMembers: _typingMembers,
	onBack,
	onDraftChange,
	onSend,
}: {
	conversationId: string | null;
	currentUserId?: string;
	draft: string;
	isMobile: boolean;
	isSending: boolean;
	isThreadPending: boolean;
	selectedConversation: ConversationSummary | null;
	thread: ConversationThreadType | null | undefined;
	typingMembers: ConversationMemberView[];
	onBack: () => void;
	onDraftChange: (value: string) => void;
	onSend: (message?: string) => Promise<void> | void;
}) => {
	const messageRef = useRef<InputMessageRefType | null>(null);
	if (!conversationId || !selectedConversation) {
		return (
			<div className="flex h-full items-center justify-center px-6 text-sm text-muted">
				Select a conversation to start coordinating.
			</div>
		);
	}

	return (
		<Skeleton
			className="h-full min-h-0 *:data-[boneyard-content=true]:h-full *:data-[boneyard-content=true]:min-h-0"
			name="messages-conversation-thread"
			loading={isThreadPending || !thread}
		>
			{thread && (
				<div className="flex h-full min-h-0 flex-col">
					<div
						className={cn(
							"flex shrink-0 items-center gap-3 border-b border-border px-4 py-3",
							!isMobile && "py-0 border-none",
						)}
					>
						{isMobile ? (
							<Button
								aria-label="Back"
								className="shrink-0"
								isIconOnly
								onPress={onBack}
								startContent={
									<ChevronRightIcon
										aria-hidden="true"
										className="size-4 rotate-180"
										title="Back"
									/>
								}
								variant="ghost"
							/>
						) : null}
					</div>

					<ScrollShadow
						className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
						hideScrollBar
						size={8}
					>
						<div className="space-y-3">
							{thread.messages.length === 0 ? (
								<div className="flex min-h-56 items-center justify-center rounded-sm border border-dashed border-border px-4 text-sm text-muted">
									No messages yet. Start the coordination thread here.
								</div>
							) : (
								thread.messages.map((entry) => {
									const isOwn = entry.senderId === currentUserId;
									return <Message key={entry.id} isOwn={isOwn} entry={entry} />;
								})
							)}
						</div>
					</ScrollShadow>

					<div className="shrink-0 bg-surface p-4">
						<InputMessage
							ref={messageRef}
							className="w-full"
							isDisabled={isSending}
							onChange={(e) => {
								messageRef.current?.setValue(e);
							}}
							sendMessage={async () => onSend(messageRef.current?.getValue())}
							value={draft}
						/>
					</div>
				</div>
			)}
		</Skeleton>
	);
};
