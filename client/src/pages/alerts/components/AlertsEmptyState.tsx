import { Card } from "@heroui/react";
import { Bell } from "lucide-react";

export const AlertsEmptyState = () => {
	return (
		<Card className="h-full rounded-lg border border-dashed border-border bg-transparent shadow-none">
			<Card.Content className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
				<Bell className="size-10 text-muted" />
				<p className="text-sm text-muted">No alerts yet.</p>
			</Card.Content>
		</Card>
	);
};
