import { Avatar } from "@client/components/user/Avatar";
import { Card } from "@heroui/react";
import { Check, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router";
import type { ConversationSummary } from "../hooks";
import {
	formatConversationTime,
	getConversationAvatarMember,
	getConversationTitle,
} from "./conversationDisplay";

const LastMessageStatus = ({
	conversation,
	currentUserId,
}: {
	conversation: ConversationSummary;
	currentUserId: string | undefined;
}) => {
	if (
		!conversation.lastMessage ||
		conversation.lastMessage.senderId !== currentUserId
	) {
		return null;
	}

	const status = conversation.lastMessage.deliveryStatus ?? "sent";
	const Icon = status === "sent" ? Check : CheckCheck;

	return (
		<Icon
			className={`size-3.5 shrink-0 ${
				status === "read" ? "text-secondary-text" : "text-muted"
			}`}
			aria-hidden="true"
		/>
	);
};

export const ConversationCard = ({
	conversation,
	currentUserId,
	isActive,
}: {
	conversation: ConversationSummary;
	currentUserId?: string;
	isActive?: boolean;
}) => {
	const navigate = useNavigate();
	const title = getConversationTitle(conversation, currentUserId);
	const avatarMember = getConversationAvatarMember(conversation, currentUserId);
	const preview = conversation.lastMessage?.content || "No messages yet";
	const time = conversation.lastMessage?.sentAt
		? formatConversationTime(conversation.lastMessage.sentAt)
		: null;

	return (
		<Card
			className={`m-2 gap-0 rounded border border-border p-0 shadow-none transition-colors duration-150 hover:border-accent ${
				isActive ? "bg-surface-secondary" : "bg-surface"
			}`}
		>
			<Card.Content className="p-0">
				<button
					type="button"
					onClick={() => navigate(`/messages/${conversation.conversation.id}`)}
					aria-current={isActive ? "page" : undefined}
					className="flex w-full flex-col px-3 py-3 text-left"
				>
					<div className="flex flex-row">
						<div className="flex flex-1 items-center justify-start gap-2">
							<Avatar user={avatarMember} />
							<p className="truncate text-sm font-semibold text-accent">
								{title}
							</p>
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex min-w-0 items-center justify-end gap-3">
								{time ? (
									<p className="shrink-0 text-[11px] text-muted">{time}</p>
								) : null}
							</div>
						</div>
					</div>
					<div className="mt-1 flex min-w-0 items-center justify-between gap-1.5">
						<p className="truncate text-sm text-muted">{preview}</p>
						<LastMessageStatus
							conversation={conversation}
							currentUserId={currentUserId}
						/>
					</div>
				</button>
			</Card.Content>
		</Card>
	);
};
