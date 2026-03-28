import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { RefreshIcon } from "@client/components/icons/RefreshIcon";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { Card, Separator } from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";
import { Chart } from "./components/Chart";
import { NeighborhoodPulseFeed } from "./components/NeighborhoodPulseFeed";
import { SafetyCheckInBanner } from "./components/SafetyCheckInBanner";
import { fakeStats } from "./components/fakeStats";
import { StatsCard } from "./components/StatsCard";

export const DashboardPages = () => {
	const navigate = useNavigate();
	const {
		coords,
		isLoading: geoLoading,
		isError: geoError,
	} = useGetGeolocation();
	const geoReady = !!coords && !geoError && !geoLoading;

	return (
		<div className="flex flex-col h-full bg-surface overflow-auto">
			<Header title="Dashboard" />
			<Separator />

			<div className="p-6 space-y-8">
				<SafetyCheckInBanner
					lat={coords?.lat}
					lon={coords?.long}
					geoReady={geoReady}
				/>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{fakeStats.map((stat) => (
						<StatsCard key={stat.title} stat={stat} />
					))}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<Card className="lg:col-span-2 shadow-none border border-border bg-surface/50">
						<Card.Header className="flex flex-row items-center justify-between">
							<div>
								<Card.Title>City Activity Overview</Card.Title>
								<Card.Description>
									Monitoring real-time urban dynamics
								</Card.Description>
							</div>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="primary"
									startContent={<RefreshIcon className="size-4" />}
								>
									Refresh
								</Button>
							</div>
						</Card.Header>
						<Card.Content className="h-75 flex items-center justify-center border-t border-border/10">
							<Chart />
						</Card.Content>
						<Separator />
					</Card>

					<div className="space-y-6">
						<NeighborhoodPulseFeed />

						<Card className="bg-danger/5 border border-danger-soft-hover">
							<Card.Content className="p-4 flex flex-col items-center text-center">
								<div className="p-3 bg-danger/10 border border-danger-soft rounded-full mb-3">
									<AlertTriangle className="size-6 text-danger" />
								</div>
								<h4 className="font-semibold text-danger">Local emergency</h4>
								<p className="text-xs text-danger/70 mt-1 mb-4">
									Post an urgent pulse from the map so neighbors are notified in
									real time.
								</p>
								<Button
									size="sm"
									variant="danger"
									className="w-full"
									onPress={() => navigate("/map")}
								>
									Open map
								</Button>
							</Card.Content>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
};
