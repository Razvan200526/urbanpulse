import { Header } from "@client/components/Header";
import { Button, Card, Separator } from "@heroui/react";
import {
	Activity,
	AlertTriangle,
	Bell,
	MapPin,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";

const STATS = [
	{
		title: "Active Pulses",
		value: "1,284",
		icon: MapPin,
		color: "primary",
		trend: "+12%",
	},
	{
		title: "Engagement Rate",
		value: "78.4%",
		icon: Zap,
		color: "secondary",
		trend: "+5.2%",
	},
	{
		title: "Total Users",
		value: "14,202",
		icon: Users,
		color: "tertiary",
		trend: "+8.1%",
	},
	{
		title: "Alerts Dispatched",
		value: "43",
		icon: Bell,
		color: "danger",
		trend: "-2.4%",
	},
];

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
			<Header title="Urban Pulse Dashboard" />
			<Separator />

			<div className="p-6 space-y-8">
				{/* Statistics Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{STATS.map((stat) => (
						<Card
							key={stat.title}
							className="p-4 shadow-sm border border-border/50"
						>
							<Card.Header className="flex flex-row items-center justify-between pb-2 space-y-0">
								<Card.Title className="text-sm font-medium text-foreground/70">
									{stat.title}
								</Card.Title>
								<stat.icon className={`h-4 w-4 text-${stat.color}`} />
							</Card.Header>
							<Card.Content>
								<div className="text-2xl font-bold">{stat.value}</div>
								<p className="text-xs text-foreground/50 mt-1">
									<span
										className={
											stat.trend.startsWith("+")
												? "text-primary"
												: "text-danger"
										}
									>
										{stat.trend}
									</span>{" "}
									from last month
								</p>
							</Card.Content>
						</Card>
					))}
				</div>

				{/* Abstract Layout Section */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Main Analytics Card */}
					<Card className="lg:col-span-2 shadow-md border border-border/50 bg-surface/50">
						<Card.Header className="flex flex-row items-center justify-between">
							<div>
								<Card.Title>City Activity Overview</Card.Title>
								<Card.Description>
									Monitoring real-time urban dynamics
								</Card.Description>
							</div>
							<div className="flex gap-2">
								<Button size="sm" variant="ghost">
									Export
								</Button>
								<Button size="sm" variant="primary">
									Refresh
								</Button>
							</div>
						</Card.Header>
						<Card.Content className="h-75 flex items-center justify-center border-t border-border/10">
							<div className="w-full h-full bg-linear-to-br from-primary/5 to-secondary/5 rounded-lg flex flex-col items-center justify-center border border-dashed border-border">
								<Activity className="h-12 w-12 text-primary/20 mb-4 animate-pulse" />
								<p className="text-sm text-foreground/30 font-mono">
									[ ANALYTICS VISUALIZATION PLACEHOLDER ]
								</p>
							</div>
						</Card.Content>
						<Separator />
						<Card.Footer className="flex justify-between items-center px-6 py-4">
							<div className="flex items-center gap-4">
								<div className="flex flex-col">
									<span className="text-xs text-foreground/50">
										System Load
									</span>
									{/*<Progress size="sm" value={34} className="w-24" color="primary" />*/}
								</div>
								<div className="flex flex-col">
									<span className="text-xs text-foreground/50">
										Network Health
									</span>
									{/*<Progress size="sm" value={89} className="w-24" color="secondary" />*/}
								</div>
							</div>
							{/*<Badge color="primary" variant="flat">Status: Operational</Badge>*/}
						</Card.Footer>
					</Card>

					{/* Side Cards */}
					<div className="space-y-6">
						{/* Recent Activity */}
						<Card className="shadow-sm border border-border/50">
							<Card.Header>
								<Card.Title className="text-lg flex items-center gap-2">
									<TrendingUp className="h-5 w-5 text-secondary" />
									Live Feed
								</Card.Title>
							</Card.Header>
							<Card.Content className="space-y-4">
								{RECENT_ACTIVITY_FAKE.map((activity) => (
									<div key={activity.id} className="flex items-start gap-3">
										{/*<User
											avatarProps={{ src: activity.avatar, size: "sm" }}
											name=""
										/>*/}
										<div className="flex flex-col">
											<p className="text-sm text-foreground/80 leading-tight">
												<span className="font-semibold">{activity.user}</span>{" "}
												{activity.action}{" "}
												<span className="text-primary font-medium">
													{activity.target}
												</span>
											</p>
											<span className="text-xs text-foreground/40 mt-0.5">
												{activity.time}
											</span>
										</div>
									</div>
								))}
							</Card.Content>
							<Separator />
							<Card.Footer>
								<Button size="sm" variant="ghost" fullWidth>
									View All Activity
								</Button>
							</Card.Footer>
						</Card>

						{/* Quick Alert Card */}
						<Card className="bg-danger/5 border border-danger-soft-hover">
							<Card.Content className="p-4 flex flex-col items-center text-center">
								<div className="p-3 bg-danger/10 rounded-full mb-3">
									<AlertTriangle className="h-6 w-6 text-danger" />
								</div>
								<h4 className="font-semibold text-danger">
									Emergency Dispatch
								</h4>
								<p className="text-xs text-danger/70 mt-1 mb-4">
									Immediate attention required in South Industrial Zone
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
