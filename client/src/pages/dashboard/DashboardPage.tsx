import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { RefreshIcon } from "@client/components/icons/RefreshIcon";
import { useDashboardOverview } from "@client/hooks/useDashboardOverview";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { queryClient } from "@client/main";
import { Card, Separator } from "@heroui/react";
import { Chart } from "./components/Chart";
import { getDashboardStats } from "./components/dashboardStats";
import { NeighborhoodPulseFeed } from "./components/NeighborhoodPulseFeed";
import { SafetyCheckInBanner } from "./components/SafetyCheckInBanner";
import { StatsCard } from "./components/StatsCard";

export const DashboardPages = () => {
	const { data: overview, refetch, isFetching } = useDashboardOverview();
	const {
		coords,
		isLoading: geoLoading,
		isError: geoError,
	} = useGetGeolocation();
	const geoReady = !!coords && !geoError && !geoLoading;
	const stats = getDashboardStats(overview);

	const onRefresh = () => {
		queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
		refetch();
	};

	return (
		<div className="flex h-screen flex-col bg-surface overflow-y-scroll overscroll-y-contain">
			<Header title="Dashboard" />
			<Separator />

			<div className="min-h-0 flex-1 h-full">
				<div className="space-y-6 p-4 pb-24 sm:space-y-8 sm:p-6 sm:pb-10">
					<SafetyCheckInBanner
						lat={coords?.lat}
						lon={coords?.long}
						geoReady={geoReady}
					/>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
						{stats.map((stat) => (
							<StatsCard key={stat.title} stat={stat} />
						))}
					</div>

					<div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
						<Card className="lg:col-span-2 shadow-none border border-border bg-surface/50">
							<Card.Header className="flex flex-col gap-3 border-b border-border/10 p-4 sm:flex-row sm:items-center sm:justify-between">
								<div className="min-w-0">
									<Card.Title>City Activity Overview</Card.Title>
									<Card.Description>
										Real activity from the last 7 days
									</Card.Description>
								</div>
								<div className="flex w-full gap-2 sm:w-auto sm:justify-end">
									<Button
										className="w-full sm:w-auto"
										size="sm"
										variant="primary"
										isPending={isFetching}
										startContent={<RefreshIcon className="size-4" />}
										onPress={onRefresh}
									>
										Refresh
									</Button>
								</div>
							</Card.Header>
							<Card.Content className="flex min-h-[260px] items-center justify-center p-3 sm:min-h-[320px] sm:p-4">
								<Chart data={overview?.chart ?? []} />
							</Card.Content>
						</Card>

						<div className="space-y-4 lg:space-y-6">
							<NeighborhoodPulseFeed />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
