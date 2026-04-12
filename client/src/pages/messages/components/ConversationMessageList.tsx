import { ScrollShadow } from "@heroui/react";
import { MessageSquareIcon } from "lucide-react";
import type {
	ConversationMemberView,
	ConversationThread as ConversationThreadType,
} from "../hooks";
import { Message } from "./Message";
import { MessageTypingSkeleton } from "./MessageTypingSkeleton";

export const ConversationMessageList = ({
	currentUserId,
	messages,
	typingMembers,
	typingLabel,
}: {
	currentUserId?: string;
	messages: ConversationThreadType["messages"];
	typingMembers: ConversationMemberView[];
	typingLabel: string | null;
}) => {
	return (
		<ScrollShadow
			className="h-full flex-1 overflow-y-auto px-4 py-4"
			hideScrollBar
			size={8}
		>
			<div className="h-full space-y-3">
				{messages.length === 0 ? (
					<div className="flex h-full items-center justify-center">
						<div className="flex items-center justify-center gap-2">
							<MessageSquareIcon className="size-6 text-accent" />
							<p className="font-semibold text-accent">
								No messages yet. Say hi!
							</p>
						</div>
					</div>
				) : (
					messages.map((entry) => {
						const isOwn = entry.senderId === currentUserId;
						return <Message key={entry.id} isOwn={isOwn} entry={entry} />;
					})
				)}
				{typingLabel && <MessageTypingSkeleton user={typingMembers[0]} />}
			</div>
		</ScrollShadow>
	);
};
