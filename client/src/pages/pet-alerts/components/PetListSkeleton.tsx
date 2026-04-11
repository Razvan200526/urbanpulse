import { Card, Skeleton } from "@heroui/react";

export const PetListSkeleton = () => {
	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{[...Array(6)].map((_, i) => (
				<Card
					// biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
					key={i}
					className="h-95 w-full border border-border bg-surface/60 shadow-none"
				>
					<Skeleton className="h-48 w-full rounded-t" />
					<div className="space-y-3 p-4">
						<Skeleton className="h-6 w-3/4 rounded-lg" />
						<Skeleton className="h-4 w-full rounded-lg" />
						<Skeleton className="h-4 w-5/6 rounded-lg" />
						<div className="mt-4 flex gap-2">
							<Skeleton className="h-4 w-1/3 rounded-lg" />
							<Skeleton className="h-4 w-1/3 rounded-lg" />
						</div>
					</div>
				</Card>
			))}
		</div>
	);
};
