import { H4 } from "@client/components/typography";
import { ScrollShadow, Skeleton } from "@heroui/react";
import { MessagesSquareIcon } from "lucide-react";

const ConversationListItemSkeleton = ({
	isAccent = false,
}: {
	isAccent?: boolean;
}) => {
	return (
		<div className="border-b border-border/80 px-4 py-4 last:border-b-0">
			<div className="flex items-start gap-3">
				<Skeleton className="size-11 shrink-0 rounded-full" />
				<div className="min-w-0 flex-1 space-y-2">
					<div className="flex items-center justify-between gap-3">
						<Skeleton
							className={`h-4 rounded-md ${isAccent ? "w-36" : "w-28"}`}
						/>
						<Skeleton className="h-3 w-14 rounded-md" />
					</div>
					<Skeleton className="h-3 w-full rounded-md max-w-[85%]" />
					<Skeleton className="h-3 w-24 rounded-md" />
				</div>
			</div>
		</div>
	);
};

export const ConversationListSkeleton = () => {
	return (
		<div aria-busy="true" className="flex h-full min-h-0 flex-col">
			<span className="sr-only">Loading conversations</span>
			<div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-4">
				<MessagesSquareIcon className="size-4 text-accent" />
				<H4>Your messages</H4>
			</div>

			<ScrollShadow hideScrollBar className="min-h-0 flex-1" size={8}>
				<div>
					{Array.from({ length: 6 }).map((_, index) => (
						<ConversationListItemSkeleton
							isAccent={index === 1 || index === 4}
							key={`conversation-list-skeleton-${index.toString()}`}
						/>
					))}
				</div>
			</ScrollShadow>
		</div>
	);
};
