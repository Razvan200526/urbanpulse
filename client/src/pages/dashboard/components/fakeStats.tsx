import { Bell, MapPin, Users, Zap } from "lucide-react";

export type StatType = {
	title: string;
	value: string;
	icon: React.ReactNode;
	color: "primary" | "secondary" | "tertiary" | "danger";
	trend: string;
};

export const fakeStats: StatType[] = [
	{
		title: "Active Pulses",
		value: "1,284",
		icon: <MapPin className="size-4 text-accent" />,
		color: "primary",
		trend: "+12%",
	},
	{
		title: "Engagement Rate",
		value: "78.4%",
		icon: <Zap className="size-4 text-accent" />,
		color: "secondary",
		trend: "+5.2%",
	},
	{
		title: "Total Users",
		value: "14,202",
		icon: <Users className="size-4 text-accent" />,
		color: "tertiary",
		trend: "+8.1%",
	},
	{
		title: "Alerts Dispatched",
		value: "43",
		icon: <Bell className="size-4 text-accent" />,
		color: "danger",
		trend: "-2.4%",
	},
];
