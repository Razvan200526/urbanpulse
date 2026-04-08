import { H4 } from "@client/components/typography";
import { ScrollShadow } from "@heroui/react";
import { MessagesSquareIcon } from "lucide-react";
import type { ConversationSummary } from "../hooks";
import { ConversationCard } from "./ConversationCard";

export const ConversationList = ({
	conversations,
	activeConversationId,
	currentUserId,
}: {
	conversations?: ConversationSummary[];
	activeConversationId: string | null;
	currentUserId?: string;
}) => {
	const content =
		!conversations || conversations.length === 0 ? (
			<div className="flex h-full items-center justify-center px-6 text-sm text-muted">
				It&apos;s empty here.
			</div>
		) : (
			<div>
				{conversations.map((conversation) => (
					<ConversationCard
						conversation={conversation}
						currentUserId={currentUserId}
						isActive={conversation.conversation.id === activeConversationId}
						key={conversation.conversation.id}
					/>
				))}
			</div>
		);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-4">
				<MessagesSquareIcon className="size-4 text-accent" />
				<H4>Your messages</H4>
			</div>

			<ScrollShadow hideScrollBar className="min-h-0 flex-1" size={8}>
				{content}
			</ScrollShadow>
		</div>
	);
};
