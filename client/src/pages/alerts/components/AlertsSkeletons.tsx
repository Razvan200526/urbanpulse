import { Skeleton } from "@heroui/react";

export const AlertCardSkeleton = ({
	withActions = false,
}: {
	withActions?: boolean;
}) => {
	return (
		<article className="my-1 w-full rounded border border-border bg-surface px-4 py-4">
			<div className="flex items-start gap-3">
				<Skeleton className="size-10 shrink-0 rounded-full" />

				<div className="min-w-0 flex-1 space-y-3">
					<div className="flex min-w-0 items-start justify-between gap-3">
						<div className="min-w-0 flex-1 space-y-2">
							<Skeleton className="h-4 w-32 rounded-md max-w-[70%]" />
							<Skeleton className="h-3 w-20 rounded-md max-w-[45%]" />
						</div>
						<Skeleton className="h-3 w-24 shrink-0 rounded-md" />
					</div>

					<Skeleton className="h-8 w-28 rounded-md" />
				</div>
			</div>

			{withActions ? (
				<div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
					<Skeleton className="h-8 w-full rounded-md sm:w-20" />
					<Skeleton className="h-8 w-full rounded-md sm:w-20" />
				</div>
			) : null}
		</article>
	);
};

export const AlertsFeedSkeleton = ({ count = 5 }: { count?: number }) => {
	return (
		<>
			{Array.from({ length: count }).map((_, index) => (
				<AlertCardSkeleton
					key={`alert-skeleton-${index.toString()}`}
					withActions={index % 2 === 0}
				/>
			))}
		</>
	);
};

export const AlertDetailsSkeleton = () => {
	return (
		<div className="space-y-4">
			<div className="overflow-hidden rounded border border-border bg-surface">
				<div className="flex items-center gap-2 border-b border-border px-4 py-4">
					<Skeleton className="size-5 rounded-md" />
					<Skeleton className="h-5 w-44 rounded-md" />
				</div>
				<div className="flex items-center gap-4 px-4 py-4">
					<Skeleton className="size-12 rounded-full" />
					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-5 w-36 rounded-md max-w-[60%]" />
						<Skeleton className="h-4 w-28 rounded-md max-w-[45%]" />
					</div>
				</div>
			</div>

			<div className="rounded border border-border bg-surface p-4">
				<div className="flex items-center gap-2">
					<Skeleton className="size-5 rounded-md" />
					<Skeleton className="h-5 w-32 rounded-md" />
				</div>

				<div className="mt-4 space-y-3">
					{Array.from({ length: 3 }).map((_, index) => (
						<div
							key={`details-row-skeleton-${index.toString()}`}
							className="flex items-center justify-between rounded border border-accent-soft-hover bg-surface px-3 py-2"
						>
							<Skeleton className="h-4 w-20 rounded-md" />
							<Skeleton className="h-4 w-24 rounded-md" />
						</div>
					))}
				</div>

				<Skeleton className="mt-4 h-4 w-48 rounded-md max-w-[70%]" />
			</div>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<Skeleton className="h-10 w-full rounded-md sm:w-28" />
				<Skeleton className="h-10 w-full rounded-md sm:w-28" />
			</div>
		</div>
	);
};
