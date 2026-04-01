import { Header } from "@client/components/Header";
import { Button } from "@client/components/Button/Button";
import { Dropdown } from "@client/components/Dropdown";
import { Chip, Drawer, ProgressCircle } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { AlertDetailsDrawer } from "./components/AlertDetailsDrawer";
import { AlertsFeed } from "./components/AlertsFeed";
import {
	alertFilterLabels,
	buildAlertFilterDropdownItems,
} from "./filterDropdownItems";
import { useAlertsPageData } from "./hooks";
import { useAlertsPageStore } from "./store";

export const AlertsPage = () => {
	const { isPending, filter, allNotifications, actionableCount, updatesCount } =
		useAlertsPageData();
	const setFilter = useAlertsPageStore((state) => state.setFilter);

	if (isPending) {
		return (
			<ProgressCircle
				isIndeterminate
				className="h-screen flex items-center justify-center"
			/>
		);
	}

	return (
		<div className="flex h-[calc(100dvh)] w-full flex-col bg-surface">
			<Header
				title="Alerts"
				tabs={
					<Chip
						color="accent"
						variant="soft"
						size="md"
						className="rounded-full border border-accent"
					>
						<Chip.Label>{allNotifications.length}</Chip.Label>
					</Chip>
				}
				dropdown={
					<Dropdown
						placement="bottom end"
						className="rounded border border-border"
						trigger={
							<div className="bg-accent text-foreground px-2 py-2 rounded-xl text-sm font-semibold">
								{alertFilterLabels[filter]}
							</div>
						}
						items={buildAlertFilterDropdownItems({
							filter,
							totalCount: allNotifications.length,
							actionableCount,
							updatesCount,
							onSelect: setFilter,
						})}
					/>
				}
			/>
			<div className="min-h-0 flex-1 p-4">
				<section className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(24rem,0.92fr)_minmax(32rem,1.08fr)]">
					<AlertsFeed />
					<AlertDetailsDrawer />
				</section>
			</div>
		</div>
	);
};
