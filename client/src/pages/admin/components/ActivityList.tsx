import { EmptyState } from "./EmptyState";

export const ActivityList = ({
	title,
	items,
	emptyMessage,
	renderItem,
}: {
	title: string;
	items: readonly unknown[];
	emptyMessage: string;
	renderItem: (item: any) => React.ReactNode;
}) => (
	<div className="space-y-3">
		<div className="flex items-center justify-between gap-3">
			<p className="text-sm font-semibold text-accent">{title}</p>
			<span className="text-xs text-accent/80">{items.length}</span>
		</div>
		{items.length > 0 ? (
			<div className="space-y-2">{items.map(renderItem)}</div>
		) : (
			<EmptyState message={emptyMessage} />
		)}
	</div>
);
