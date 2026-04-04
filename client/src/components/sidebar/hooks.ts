import { authQueryKey } from "@client/hooks/useAuth";
import { authClient, queryClient } from "@client/lib/api/client";
import { useMutation } from "@tanstack/react-query";
import {
	Bell,
	LayoutDashboard,
	Map as MapIcon,
	MessageSquare,
	Settings,
	ShieldAlert,
	Wrench,
} from "lucide-react";
import posthog from "posthog-js";

export const useSideBarItems = () => {
	const mainItems = [
		{
			key: "dashboard",
			icon: LayoutDashboard,
			href: "dashboard",
			title: "Dashboard",
		},
		{
			key: "map",
			icon: MapIcon,
			href: "map",
			title: "Neighborhood Map",
		},
		{
			key: "resources",
			icon: Wrench,
			href: "resources",
			title: "Skills & Resources",
		},
		{
			key: "alerts",
			icon: Bell,
			href: "alerts",
			title: "Hero Alerts",
		},
		{
			key: "messages",
			icon: MessageSquare,
			href: "messages",
			title: "Inbox",
		},
	];

	const secondaryItems = [
		{
			key: "admin",
			icon: ShieldAlert,
			href: "admin",
			title: "Moderation",
		},
		{
			key: "settings",
			icon: Settings,
			href: "settings",
			title: "Settings",
		},
	];

	return { secondaryItems, mainItems };
};

export const useSignOut = () => {
	return useMutation({
		mutationKey: ["sign-out"],
		mutationFn: async () => {
			return await authClient.signOut();
		},
		onSuccess: async () => {
			posthog.capture("user_signed_out");
			posthog.reset();
			await queryClient.invalidateQueries({ queryKey: authQueryKey });
		},
	});
};
