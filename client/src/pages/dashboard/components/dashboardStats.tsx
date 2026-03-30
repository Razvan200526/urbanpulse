import type { DashboardOverviewData } from "@client/hooks/useDashboardOverview";
import { AlertTriangle, Bell, MapPin, Users } from "lucide-react";

export type StatType = {
	title: string;
	value: string;
	icon: React.ReactNode;
	trend: string;
	comparisonLabel: string;
};

function formatTrend(change: number) {
	if (change === 0) return "No change";
	return `${change > 0 ? "+" : ""}${change}`;
}

export function getDashboardStats(
	overview?: DashboardOverviewData,
): StatType[] {
	if (!overview) {
		return [
			{
				title: "Pulses This Week",
				value: "--",
				icon: <MapPin className="size-4 text-accent" />,
				trend: "--",
				comparisonLabel: "vs previous 7 days",
			},
			{
				title: "Emergency Pulses",
				value: "--",
				icon: <AlertTriangle className="size-4 text-danger" />,
				trend: "--",
				comparisonLabel: "vs previous 7 days",
			},
			{
				title: "New Neighbors",
				value: "--",
				icon: <Users className="size-4 text-accent" />,
				trend: "--",
				comparisonLabel: "vs previous 7 days",
			},
			{
				title: "Alerts Sent",
				value: "--",
				icon: <Bell className="size-4 text-accent" />,
				trend: "--",
				comparisonLabel: "vs previous 7 days",
			},
		];
	}

	return [
		{
			title: "Pulses This Week",
			value: overview.counts.pulsesLast7Days.toLocaleString(),
			icon: <MapPin className="size-4 text-accent" />,
			trend: formatTrend(overview.changes.pulsesLast7Days),
			comparisonLabel: "vs previous 7 days",
		},
		{
			title: "Emergency Pulses",
			value: overview.counts.emergencyPulsesLast7Days.toLocaleString(),
			icon: <AlertTriangle className="size-4 text-danger" />,
			trend: formatTrend(overview.changes.emergencyPulsesLast7Days),
			comparisonLabel: "vs previous 7 days",
		},
		{
			title: "New Neighbors",
			value: overview.counts.newUsersLast7Days.toLocaleString(),
			icon: <Users className="size-4 text-accent" />,
			trend: formatTrend(overview.changes.newUsersLast7Days),
			comparisonLabel: "vs previous 7 days",
		},
		{
			title: "Alerts Sent",
			value: overview.counts.alertsLast7Days.toLocaleString(),
			icon: <Bell className="size-4 text-accent" />,
			trend: formatTrend(overview.changes.alertsLast7Days),
			comparisonLabel: "vs previous 7 days",
		},
	];
}
