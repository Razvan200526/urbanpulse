import { Card, Separator, Skeleton } from "@heroui/react";

export const ResourceCardSkeleton = () => {
	return (
		<Card className="border border-accent shadow-none">
			<Card.Header className="flex flex-row items-center justify-between">
				<Skeleton className="w-32 h-5 rounded-md" />{" "}
				<Skeleton className="w-8 h-8 rounded-full" />{" "}
			</Card.Header>

			<Card.Content className="space-y-3">
				<div className="flex items-center justify-start gap-4">
					<Skeleton className="w-10 h-10 rounded-full" />
					<Skeleton className="w-24 h-4 rounded-md" />
				</div>

				<div className="flex flex-wrap gap-2">
					<Skeleton className="w-20 h-6 rounded-full" />{" "}
					<Skeleton className="w-16 h-6 rounded-full" />{" "}
				</div>

				<div className="flex items-center gap-1 mt-2">
					<Skeleton className="w-3 h-3 rounded-full" />
					<Skeleton className="w-20 h-3 rounded-md" />
				</div>
			</Card.Content>

			<Separator />

			<Card.Footer className="flex justify-between items-center py-3">
				<div className="flex -space-x-2">
					<Skeleton className="w-8 h-8 rounded-full border-2 border-content1" />
					<Skeleton className="w-8 h-8 rounded-full border-2 border-content1" />
					<Skeleton className="w-8 h-8 rounded-full border-2 border-content1" />
				</div>
				<Skeleton className="w-20 h-9 rounded-lg" />
			</Card.Footer>
		</Card>
	);
};

export const ResourceListSkeleton = ({ count = 8 }: { count?: number }) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
			{Array.from({ length: count }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: <skeletons don't reorder>
				<ResourceCardSkeleton key={i} />
			))}
		</div>
	);
};
