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
		<div className="flex flex-col h-[calc(100dvh)] bg-surface overflow-hidden">
			<Header title="Dashboard" />
			<Separator />

			<div>
				<div className="p-6 space-y-8">
					<SafetyCheckInBanner
						lat={coords?.lat}
						lon={coords?.long}
						geoReady={geoReady}
					/>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{stats.map((stat) => (
							<StatsCard key={stat.title} stat={stat} />
						))}
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<Card className="lg:col-span-2 shadow-none border border-border bg-surface/50">
							<Card.Header className="flex flex-row items-center justify-between">
								<div>
									<Card.Title>City Activity Overview</Card.Title>
									<Card.Description>
										Real activity from the last 7 days
									</Card.Description>
								</div>
								<div className="flex gap-2">
									<Button
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
							<Card.Content className="flex items-center justify-center border-t border-border/10">
								<Chart data={overview?.chart ?? []} />
							</Card.Content>
							<Separator />
						</Card>

						<div className="space-y-6 max-h-full">
							<NeighborhoodPulseFeed />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
