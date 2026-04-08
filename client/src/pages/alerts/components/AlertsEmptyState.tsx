import { BellIcon } from "@client/components/icons/BellIcon";
import { Card } from "@heroui/react";

export const AlertsEmptyState = () => {
	return (
		<Card className="h-full rounded border border-border bg-surface shadow-none">
			<Card.Content className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
				<BellIcon className="size-10 text-accent" />
				<p className="text-sm font-semibold text-accent">No alerts yet.</p>
			</Card.Content>
		</Card>
	);
};
