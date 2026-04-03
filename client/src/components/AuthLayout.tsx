import { HelpOfferSnackbar } from "@client/components/notifications/HelpOfferSnackbar";
import { useAuth } from "@client/hooks/useAuth";
import { useLocationSync } from "@client/hooks/useLocationSync";
import { useNotifications } from "@client/hooks/useNotifications";
import { cn } from "@heroui/react";
import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { PageLoader } from "./PageLoader";
import { Sidebar } from "./sidebar/Sidebar";
import { SidebarDrawer } from "./sidebar/SidebarDrawer";
import { useAppSidebarStore } from "./sidebar/sidebarStore";
import { useThemeStore } from "./sidebar/store";

export const AuthLayout = () => {
	const { data: user, isPending } = useAuth();
	const { theme } = useThemeStore();
	const { isOpen } = useAppSidebarStore();

	useNotifications(user?.user.id);
	useLocationSync();

	useEffect(() => {
		document.body.setAttribute("data-theme", theme);
	});

	if (isPending) {
		return <PageLoader />;
	}

	if (!user) {
		return <Navigate to="/signin" replace />;
	}

	return (
		<div className="flex min-h-dvh w-full bg-background font-medium">
			<HelpOfferSnackbar />
			<SidebarDrawer />
			<div
				className={cn(
					"relative hidden h-dvh w-64 shrink-0 self-start border-r border-border bg-surface p-2 transition-all duration-300 ease-in-out 2xl:flex",
					!isOpen ? "hidden" : "hidden 2xl:flex",
				)}
			>
				<Sidebar />
			</div>
			<div className={cn("min-w-0 flex-1 min-h-dvh overflow-auto font-normal")}>
				<Outlet />
			</div>
		</div>
	);
};
