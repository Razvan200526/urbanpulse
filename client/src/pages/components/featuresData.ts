import type { SVGProps } from "react";
import { BellIcon } from "../../components/icons/BellIcon";
import { BoltIcon } from "../../components/icons/BoltIcon";
import { LocationIcon } from "../../components/icons/LocationIcon";
import { MapIcon } from "../../components/icons/MapIcon";
import { SignalIcon } from "../../components/icons/SignalIcon";

export interface Feature {
	icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
	title: string;
	label: string;
	description: string;
	gradient: string;
	visual: "alerts" | "map" | "response" | "local" | "feed";
}

export const features: Feature[] = [
	{
		icon: BellIcon,
		label: "Alerts",
		title: "Real-time notifications",
		description:
			"Get instant notifications about incidents, road closures, and emergencies happening right in your neighbourhood. Never miss a critical update again.",
		gradient: "from-(--danger)/30 via-(--warning)/20 to-transparent",
		visual: "alerts",
	},
	{
		icon: MapIcon,
		label: "Map",
		title: "Live community map",
		description:
			"See a live, interactive map of everything happening around you — powered by your neighbours and local authorities in real-time.",
		gradient: "from-(--accent)/30 via-(--success)/20 to-transparent",
		visual: "map",
	},
	{
		icon: BoltIcon,
		label: "Response",
		title: "Built for rapid action",
		description:
			"Connect with people nearby who can help in seconds. Report, request, or respond instantly.",
		gradient: "from-(--success)/30 via-(--accent)/20 to-transparent",
		visual: "response",
	},
	{
		icon: LocationIcon,
		label: "Local",
		title: "Hyperlocal focus",
		description:
			"Everything is scoped to your immediate area. See only what matters within walking distance.",
		gradient: "from-(--warning)/30 via-(--danger)/20 to-transparent",
		visual: "local",
	},
	{
		icon: SignalIcon,
		label: "Feed",
		title: "Live pulse feed",
		description:
			"A continuous stream of community updates — from safety alerts to neighbourhood events.",
		gradient: "from-(--accent)/30 via-purple-500/20 to-transparent",
		visual: "feed",
	},
];
