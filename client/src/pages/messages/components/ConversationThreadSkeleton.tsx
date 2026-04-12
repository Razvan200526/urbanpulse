import { H4 } from "@client/components/typography";
import { ScrollShadow, Skeleton } from "@heroui/react";

const MessageBubbleSkeleton = ({ isOwn = false }: { isOwn?: boolean }) => {
	if (isOwn) {
		return (
			<div className="flex justify-end">
				<div className="flex w-full max-w-[75%] flex-col items-end gap-2">
					<Skeleton className="h-3 w-20 rounded-md" />
					<Skeleton className="h-10 w-56 rounded-[1.25rem]" />
					<Skeleton className="h-10 w-40 rounded-[1.25rem]" />
				</div>
			</div>
		);
	}

	return (
		<div className="flex justify-start gap-3">
			<Skeleton className="mt-1 size-9 shrink-0 rounded-full" />
			<div className="flex w-full max-w-[80%] flex-col gap-2">
				<Skeleton className="h-3 w-28 rounded-md" />
				<Skeleton className="h-10 w-52 rounded-[1.25rem]" />
				<Skeleton className="h-10 w-64 rounded-[1.25rem]" />
			</div>
		</div>
	);
};

export const ConversationThreadSkeleton = ({
	showBackButton = false,
}: {
	showBackButton?: boolean;
}) => {
	return (
		<div aria-busy="true" className="flex h-full min-h-0 flex-col">
			<span className="sr-only">Loading conversation thread</span>
			<div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
				{showBackButton ? (
					<Skeleton className="size-8 shrink-0 rounded-full" />
				) : null}
				<div className="min-w-0 flex-1">
					<H4 className="text-accent">
						<Skeleton className="h-5 w-40 rounded-md" />
					</H4>
					<div className="mt-2">
						<Skeleton className="h-3 w-28 rounded-md" />
					</div>
				</div>
			</div>

			<ScrollShadow
				className="h-full flex-1 overflow-y-auto px-4 py-4"
				hideScrollBar
				size={8}
			>
				<div className="space-y-4">
					<MessageBubbleSkeleton />
					<MessageBubbleSkeleton isOwn />
					<MessageBubbleSkeleton />
					<MessageBubbleSkeleton isOwn />
				</div>
			</ScrollShadow>

			<div className="shrink-0 bg-surface p-4">
				<div className="flex items-end gap-3 rounded-[1.75rem] border border-border bg-surface px-4 py-3">
					<div className="flex-1 space-y-2">
						<Skeleton className="h-3 w-40 rounded-md" />
						<Skeleton className="h-3 w-24 rounded-md" />
					</div>
					<Skeleton className="size-10 rounded-full" />
				</div>
			</div>
		</div>
	);
};
