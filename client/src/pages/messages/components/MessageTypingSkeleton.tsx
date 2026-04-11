import { Avatar } from "@client/components/user/Avatar";
import type { ConversationMemberView } from "../hooks";

export const MessageTypingSkeleton = ({
	user,
}: {
	user: ConversationMemberView | null;
}) => {
	return (
		<div className="flex justify-start gap-3">
			<Avatar user={user} />
			<div className="flex max-w-[85%] items-center justify-center gap-1 rounded-full bg-surface-secondary px-4 py-3 sm:max-w-xl">
				<div
					className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40"
					style={{ animationDelay: "0ms" }}
				/>
				<div
					className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40"
					style={{ animationDelay: "150ms" }}
				/>
				<div
					className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40"
					style={{ animationDelay: "300ms" }}
				/>
			</div>
		</div>
	);
};
