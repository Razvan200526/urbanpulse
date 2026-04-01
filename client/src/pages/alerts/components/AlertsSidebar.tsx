import { Button } from "@client/components/Button/Button";
import { Card, Chip } from "@heroui/react";
import { alertsFilterConfig } from "../constants";
import { useAlertsPageData } from "../hooks";
import { useAlertsPageStore } from "../store";

export const AlertsSidebar = () => {
	const { filter, allNotifications, actionableCount } = useAlertsPageData();
	const setFilter = useAlertsPageStore((state) => state.setFilter);

	return (
		<aside className="w-full shrink-0 lg:w-72">
			<div className="flex h-full flex-col gap-4">
				<Card className="rounded-sm border border-border shadow-none">
					<Card.Content className="flex flex-col gap-3 p-4">
						<Chip
							className="h-7 rounded-full border border-accent bg-surface w-18"
							variant="primary"
						>
							<Chip.Label>
								<p className="font-semibold text-sm text-accent">
									Total {allNotifications.length}
								</p>
							</Chip.Label>
						</Chip>
						<div className="flex flex-col gap-2">
							{alertsFilterConfig.map((item) => {
								const isActive = filter === item.key;
								return (
									<Button
										key={item.key}
										size="sm"
										onPress={() => setFilter(item.key)}
										className={
											isActive
												? "justify-start border border-accent bg-accent px-3 text-accent-foreground"
												: "justify-start border border-border bg-surface-secondary px-3 text-foreground"
										}
									>
										{item.label}
									</Button>
								);
							})}
						</div>
					</Card.Content>
				</Card>
			</div>
		</aside>
	);
};
