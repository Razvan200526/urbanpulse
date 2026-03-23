import { Button } from "@client/components/Button/Button";
import { Header } from "@client/components/Header";
import { RefreshIcon } from "@client/components/icons/RefreshIcon";
import { Avatar } from "@client/components/user/Avatar";
import { Card, Separator } from "@heroui/react";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { Chart } from "./components/Chart";
import { fakeStats } from "./components/fakeStats";
import { StatsCard } from "./components/StatsCard";

const RECENT_ACTIVITY_FAKE = [
	{
		id: 1,
		user: "Elena Smith",
		action: "confirmed a pulse in",
		target: "Sector 7G",
		time: "2m ago",
		avatar: "https://i.pravatar.cc/150?u=elena",
	},
	{
		id: 2,
		user: "Marcus Chen",
		action: "reported a water leak",
		target: "Downtown",
		time: "15m ago",
		avatar: "https://i.pravatar.cc/150?u=marcus",
	},
	{
		id: 3,
		user: "Sarah Miller",
		action: "joined the community",
		target: "North District",
		time: "1h ago",
		avatar: "https://i.pravatar.cc/150?u=sarah",
	},
];

export const DashboardPages = () => {
	return (
		<div className="flex flex-col h-full bg-background overflow-auto">
			<Header title="Dashboard" />
			<Separator />

			<div className="p-6 space-y-8">
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
						<Card className="shadow-none border border-border">
							<Card.Header>
								<Card.Title className="text-lg flex items-center text-accent gap-2">
									<TrendingUp className="size-4" />
									Live Feed
								</Card.Title>
							</Card.Header>
							<Card.Content className="space-y-4">
								{RECENT_ACTIVITY_FAKE.map((activity) => (
									<div key={activity.id} className="flex items-start gap-3">
										<Avatar />
										<div className="flex flex-col">
											<p className="text-sm leading-tight">
												<span className="font-semibold text-accent">
													{activity.user}
												</span>{" "}
												{activity.action}{" "}
												<span className="text-muted font-medium">
													{activity.target}
												</span>
											</p>
											<span className="text-xs text-muted mt-0.5">
												{activity.time}
											</span>
										</div>
									</div>
								))}
							</Card.Content>
							<Separator />
							<Card.Footer>
								<Button size="sm" variant="primary" fullWidth>
									View All Activity
								</Button>
							</Card.Footer>
						</Card>

						<Card className="bg-danger/5 border border-danger-soft-hover">
							<Card.Content className="p-4 flex flex-col items-center text-center">
								<div className="p-3 bg-danger/10 border border-danger-soft rounded-full mb-3">
									<AlertTriangle className="size-6 text-danger" />
								</div>
								<h4 className="font-semibold text-danger">
									Emergency Dispatch
								</h4>
								<p className="text-xs text-danger/70 mt-1 mb-4">
									Immediate attention required at your location
								</p>
								<Button size="sm" variant="danger" className="w-full">
									Deploy Team
								</Button>
							</Card.Content>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
};
