import {
	Dropdown,
	type DropdownItemDataType,
} from "@client/components/Dropdown";
import { Header } from "@client/components/Header";
import { AllIcon } from "@client/components/icons/AllIcon";
import { Chip, ProgressCircle } from "@heroui/react";
import { AlertTriangle, Bell, Filter } from "lucide-react";
import { AlertDetailsDrawer } from "./components/AlertDetailsDrawer";
import { AlertsFeed } from "./components/AlertsFeed";
import { useAlertsPageData } from "./hooks";
import { type AlertsFilter, useAlertsPageStore } from "./store";

export const AlertsPage = () => {
	const { isPending, filter, allNotifications } = useAlertsPageData();
	const setFilter = useAlertsPageStore((state) => state.setFilter);
	const filterDropdownItems: DropdownItemDataType[] = [
		{
			label: "All alerts",
			key: "all",
			icon: (
				<AllIcon className="size-4 text-foreground group-hover:text-accent" />
			),
			className:
				"bg-surface hover:bg-accent/5 group group-hover transition-colors duration-150 ease-out",
			labelClassName: "text-foreground text-sm group-hover:text-accent",
		},
		{
			label: "Action needed",
			key: "actionable",
			icon: (
				<AlertTriangle className="size-4 text-foreground group-hover:text-danger" />
			),
			className:
				"bg-surface hover:bg-danger/10 group group-hover transition-colors duration-150 ease-out",
			labelClassName: "text-foreground text-sm group-hover:text-danger",
		},
		{
			label: "Updates",
			key: "updates",
			icon: (
				<Bell
					fill="currentColor"
					className="size-4 text-foreground group-hover:text-sky-400"
				/>
			),
			className:
				"bg-surface hover:bg-sky-400/10 group group-hover transition-colors duration-150 ease-out",
			labelClassName: "text-foreground text-sm group-hover:text-sky-400",
		},
	];

	if (isPending) {
		return (
			<ProgressCircle
				aria-label="Loading"
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
						className="rounded border border-accent-soft"
						trigger={
							<div className="flex items-center gap-2 rounded-md border border-accent-soft bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors duration-150 ease-out hover:bg-surface-secondary/60">
								<Filter className="size-4 text-accent" />
								<span>
									{filterDropdownItems.find(
										(item) => item.key === (filter as string),
									)?.label || "All alerts"}
								</span>
							</div>
						}
						items={filterDropdownItems}
						onAction={(key) => {
							setFilter(key.toString() as AlertsFilter);
						}}
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
