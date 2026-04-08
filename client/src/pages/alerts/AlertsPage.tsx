import {
	Dropdown,
	type DropdownItemDataType,
} from "@client/components/Dropdown";
import { Header } from "@client/components/Header";
import { AllIcon } from "@client/components/icons/AllIcon";
import { BellIcon } from "@client/components/icons/BellIcon";
import { useIsMobile } from "@client/hooks/useMediaQuery";
import { Chip, Skeleton } from "@heroui/react";
import { AlertTriangle, Filter } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertDetailsDrawer } from "./components/AlertDetailsDrawer";
import { AlertsFeed } from "./components/AlertsFeed";
import { useAlertsPageData } from "./hooks";
import { type AlertsFilter, useAlertsPageStore } from "./store";

export const AlertsPage = () => {
	const isMobile = useIsMobile();
	const navigate = useNavigate();
	const { notificationId } = useParams<{ notificationId: string }>();
	const {
		filter,
		allNotifications,
		filteredNotifications,
		isPending,
		resolvedSelectedAlertId,
		selectedItem,
	} = useAlertsPageData({
		selectedAlertId: notificationId ?? null,
		isMobile,
	});
	const setFilter = useAlertsPageStore((state) => state.setFilter);
	const hasSelectedAlert = filteredNotifications.some(
		(item) => item.notification?.id === notificationId,
	);

	useEffect(() => {
		if (isPending) {
			return;
		}

		if (notificationId && hasSelectedAlert) {
			return;
		}

		if (resolvedSelectedAlertId && !isMobile) {
			navigate(`/alerts/${resolvedSelectedAlertId}`, { replace: true });
			return;
		}

		if (notificationId) {
			navigate("/alerts", { replace: true });
		}
	}, [
		hasSelectedAlert,
		isMobile,
		isPending,
		navigate,
		notificationId,
		resolvedSelectedAlertId,
	]);

	const filterDropdownItems: DropdownItemDataType[] = [
		{
			label: "All alerts",
			key: "all",
			icon: <AllIcon className="size-4 text-accent group-hover:text-accent" />,
			className:
				"bg-surface hover:bg-accent/5 group group-hover transition-colors duration-150 ease-out",
			labelClassName: "text-accent text-sm group-hover:text-accent",
		},

		{
			label: "Updates",
			key: "updates",
			icon: <BellIcon className="size-4 text-accent group-hover:text-accent" />,
			className:
				"bg-surface hover:bg-accent/5 group group-hover transition-colors duration-150 ease-out",
			labelClassName: "text-accent text-sm group-hover:text-accent",
		},
		{
			label: "Action needed",
			key: "actionable",
			icon: (
				<AlertTriangle className="size-4 text-danger group-hover:text-danger" />
			),
			className:
				"bg-surface hover:bg-danger/10 group group-hover transition-colors duration-150 ease-out",
			labelClassName: "text-danger text-sm group-hover:text-danger",
		},
	];

	return (
		<div className="flex h-[calc(100dvh)] min-w-0 w-full flex-col overflow-hidden bg-surface">
			<Header
				title="Alerts"
				layout="inline-mobile"
				tabs={
					isPending ? (
						<Skeleton className="h-6 w-10 rounded-full border border-accent/40" />
					) : (
						<Chip
							color="accent"
							variant="soft"
							size="sm"
							className="rounded-full border border-accent"
						>
							<Chip.Label>{allNotifications.length}</Chip.Label>
						</Chip>
					)
				}
				dropdown={
					<Dropdown
						placement="bottom end"
						className="rounded border border-accent-soft"
						trigger={
							<div className="flex cursor-pointer min-w-24 items-center justify-between gap-2 rounded border border-accent bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors duration-150 ease-out hover:bg-surface-secondary/60">
								<Filter className="size-4 text-accent" />
								<span className="text-accent">
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
			<div className="min-h-0 flex-1 p-4 sm:p-6">
				<section className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(24rem,0.92fr)_minmax(32rem,1.08fr)]">
					<AlertsFeed
						activeAlertId={resolvedSelectedAlertId}
						filteredNotifications={filteredNotifications}
						isPending={isPending}
					/>
					<AlertDetailsDrawer
						onClose={() => navigate("/alerts")}
						selectedItem={selectedItem}
						isPending={isPending}
						isOpen={Boolean(selectedItem) || (isPending && Boolean(notificationId))}
					/>
				</section>
			</div>
		</div>
	);
};
