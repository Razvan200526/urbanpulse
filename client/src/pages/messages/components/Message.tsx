import { Avatar } from "@client/components/user/Avatar";
import type { ConversationMemberView, MessageDeliveryStatus } from "../hooks";
import { MessageDeliveryMark } from "./MessageDeliveryMark";

export const Message = ({
	entry,
	isOwn,
}: {
	entry: {
		id: string;
		content: string;
		senderId: string;
		sentAt: string;
		sender: ConversationMemberView | null;
		deliveryStatus: MessageDeliveryStatus;
	};
	isOwn: boolean;
}) => {
	return (
		<div
			key={entry.id}
			className={`flex gap-3 ${isOwn ? "justify-end" : "justify-start"}`}
		>
			<Avatar user={entry.sender} />
			<div
				className={`max-w-[85%] rounded-full flex items-center justify-center gap-2 px-4 py-2 sm:max-w-xl ${
					isOwn
						? "bg-accent/30 text-accent"
						: "bg-surface-secondary text-foreground"
				}`}
			>
				<p className="whitespace-pre-wrap text-wrap text-sm">{entry.content}</p>
				<div className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-75">
					<span>
						{new Date(entry.sentAt).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</span>
					{isOwn ? (
						<MessageDeliveryMark status={entry.deliveryStatus ?? "sent"} />
					) : null}
				</div>
			</div>
		</div>
	);
};
