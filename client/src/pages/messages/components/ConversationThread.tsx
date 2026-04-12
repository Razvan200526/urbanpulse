import type {
	ConversationMemberView,
	ConversationSummary,
	ConversationThread as ConversationThreadType,
} from "../hooks";
import { ConversationThreadModals } from "./ConversationActionModals";
import {
	ConversationComposer,
	type ConversationComposerControls,
} from "./ConversationComposer";
import { ConversationMessageList } from "./ConversationMessageList";
import { ConversationThreadHeader } from "./ConversationThreadHeader";
import { getConversationTitle } from "./conversationDisplay";
import { useConversationThreadActions } from "./useConversationThreadActions";

type ConversationView = ConversationSummary | ConversationThreadType;

const buildTypingLabel = (typingMembers: ConversationMemberView[]) => {
	const typingNames = typingMembers
		.map((member) => member.name)
		.filter((name): name is string => Boolean(name));

	if (typingNames.length === 0) {
		return null;
	}

	return typingNames.length === 1
		? `${typingNames[0]} is typing...`
		: `${typingNames.join(", ")} are typing...`;
};

export const ConversationThread = ({
	composer,
	conversation,
	conversationId,
	currentUserId,
	onBack,
	thread,
	typingMembers,
}: {
	composer: ConversationComposerControls;
	conversation: ConversationView | null;
	conversationId: string | null;
	currentUserId?: string;
	onBack: () => void;
	thread: ConversationThreadType | null | undefined;
	typingMembers: ConversationMemberView[];
}) => {
	const actions = useConversationThreadActions({
		conversation,
		conversationId,
		currentUserId,
		onBack,
	});

	if (!conversationId || !conversation) {
		return (
			<div className="flex h-full items-center justify-center px-6 text-sm text-muted">
				Select a conversation to start coordinating.
			</div>
		);
	}

	if (!thread) {
		return null;
	}

	const title = getConversationTitle(conversation, currentUserId);
	const typingLabel = buildTypingLabel(typingMembers);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<ConversationThreadHeader
				dropdownItems={actions.dropdownItems}
				onBack={onBack}
				title={title}
				typingLabel={typingLabel}
			/>

			<ConversationMessageList
				currentUserId={currentUserId}
				messages={thread.messages}
				typingLabel={typingLabel}
				typingMembers={typingMembers}
			/>

			<ConversationComposer {...composer} />

			<ConversationThreadModals
				deleteModalRef={actions.deleteModalRef}
				handleDeleteConversation={actions.handleDeleteConversation}
				handleResolveConversation={actions.handleResolveConversation}
				handleSubmitReport={actions.handleSubmitReport}
				isCreatingReport={actions.isCreatingReport}
				isDeletingConversation={actions.isDeletingConversation}
				isResolvingConversation={actions.isResolvingConversation}
				reportModalRef={actions.reportModalRef}
				reportedUserName={actions.reportedUserName}
				resolveModalRef={actions.resolveModalRef}
			/>
		</div>
	);
};
