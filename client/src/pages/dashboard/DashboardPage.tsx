import { Button } from "@client/components/Button/Button";
import { ChartContainer } from "@client/components/charts/ChartContainer";
import { Header } from "@client/components/Header";
import { RefreshIcon } from "@client/components/icons/RefreshIcon";
import { useDashboardOverview } from "@client/hooks/useDashboardOverview";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { queryClient } from "@client/lib/api/client";
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
		<div className="flex h-[calc(100dvh)] w-full min-w-0 flex-col overflow-hidden bg-surface">
			<Header title="Dashboard" />
			<Separator />

			<div className="min-h-0 flex-1 overflow-y-auto">
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
						<Card className="border border-accent bg-surface/50 shadow-none lg:col-span-2">
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
							<Card.Content className="flex min-h-65 items-center justify-center p-3 sm:min-h-80 sm:p-4">
								<ChartContainer>
									<Chart data={overview?.chart ?? []} />
								</ChartContainer>
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
