import {
	InputMessage,
	type InputMessageRefType,
} from "@client/components/input/InputMessage";
import { useRef } from "react";

export type ConversationComposerControls = {
	draft: string;
	isSending: boolean;
	onDraftChange: (value: string) => void;
	onSend: (message?: string) => Promise<void> | void;
};

export const ConversationComposer = ({
	draft,
	isSending,
	onDraftChange,
	onSend,
}: ConversationComposerControls) => {
	const messageRef = useRef<InputMessageRefType | null>(null);

	return (
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
	);
};
