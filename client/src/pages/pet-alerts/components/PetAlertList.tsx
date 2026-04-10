import { Card, Skeleton } from "@heroui/react";
import { PetAlertCard } from "./PetAlertCard";
import type { ClientPetAlert } from "@client/utils/petAlerts";

interface PetAlertListProps {
	alerts: ClientPetAlert[] | undefined;
	isLoading: boolean;
}

export const PetAlertList = ({ alerts, isLoading }: PetAlertListProps) => {
	if (isLoading) {
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
	}

	if (!alerts || alerts.length === 0) {
		return (
			<div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-secondary/20 p-8 text-center">
				<p className="text-lg font-medium text-foreground">
					No pet alerts found
				</p>
				<p className="mt-1 text-sm text-muted">
					Be the first to report a lost or found pet in your neighborhood.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{alerts.map((alert) => (
				<PetAlertCard key={alert.id} alert={alert} />
			))}
		</div>
	);
};
