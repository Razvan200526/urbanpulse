import { Button } from "@client/components/Button/Button";
import { ChevronRightIcon } from "@client/components/icons/ChevronRight";
import {
	InputMessage,
	type InputMessageRefType,
} from "@client/components/input/InputMessage";
import { H4 } from "@client/components/typography";
import { cn, ScrollShadow } from "@heroui/react";
import { MessageSquareIcon } from "lucide-react";
import { useRef } from "react";
import type {
	ConversationMemberView,
	ConversationSummary,
	ConversationThread as ConversationThreadType,
} from "../hooks";
import { getConversationTitle } from "./conversationDisplay";
import { Message } from "./Message";
import { MessageTypingSkeleton } from "./MessageTypingSkeleton";

export const ConversationThread = ({
	conversationId,
	currentUserId,
	draft,
	isMobile,
	isSending,
	selectedConversation,
	thread,
	typingMembers,
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

	const title = getConversationTitle(selectedConversation, currentUserId);
	const typingNames = typingMembers
		.map((member) => member.name)
		.filter((name): name is string => Boolean(name));
	const typingLabel =
		typingNames.length === 0
			? null
			: typingNames.length === 1
				? `${typingNames[0]} is typing...`
				: `${typingNames.join(", ")} are typing...`;

	return (
		thread && (
			<div className="flex h-full min-h-0 flex-col">
				<div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
					{isMobile ? (
						<Button
							aria-label="Back"
							className="shrink-0"
							isIconOnly
							size="sm"
							radius="full"
							onPress={onBack}
							startContent={
								<ChevronRightIcon
									aria-hidden="true"
									className="size-4 rotate-180 text-accent"
									title="Back"
								/>
							}
							variant="ghost"
						/>
					) : null}
					<div className="min-w-0 flex-1">
						<H4 className="truncate text-accent">{title}</H4>
						<p
							className={cn(
								"text-xs",
								typingLabel ? "text-secondary-text" : "text-muted",
							)}
						>
							{typingLabel}
						</p>
					</div>
				</div>

				<ScrollShadow
					className="h-full flex-1 overflow-y-auto px-4 py-4"
					hideScrollBar
					size={8}
				>
					<div className="space-y-3 h-full">
						{thread.messages.length === 0 ? (
							<div className="h-full flex items-center justify-center">
								<div className="flex items-center justify-center gap-2">
									<MessageSquareIcon className="size-6 text-accent" />
									<p className="text-accent font-semibold">
										No messages yet. Say hi!
									</p>
								</div>
							</div>
						) : (
							thread.messages.map((entry) => {
								const isOwn = entry.senderId === currentUserId;
								return <Message key={entry.id} isOwn={isOwn} entry={entry} />;
							})
						)}
						{typingLabel && <MessageTypingSkeleton user={typingMembers[0]} />}
					</div>
				</ScrollShadow>

				<div className="shrink-0 bg-surface p-4">
					<InputMessage
						aria-label="input-message"
						ref={messageRef}
						className="w-full"
						isDisabled={isSending}
						onChange={onDraftChange}
						sendMessage={async () => onSend(messageRef.current?.getValue())}
						value={draft}
					/>
				</div>
			</div>
		)
	);
};
