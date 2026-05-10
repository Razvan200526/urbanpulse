import { HelpOfferSnackbar } from "@client/components/notifications/HelpOfferSnackbar";
import { useAuth } from "@client/hooks/useAuth";
import { useLocationSync } from "@client/hooks/useLocationSync";
import { useNotifications } from "@client/hooks/useNotifications";
import { useCrisisStore } from "@client/stores/crisisStore";
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
	const { isCrisisModeActive } = useCrisisStore();

	useNotifications(user?.user.id || "");
	useLocationSync();

	useEffect(() => {
		document.body.setAttribute(
			"data-theme",
			isCrisisModeActive ? "dark" : theme,
		);
		if (isCrisisModeActive) {
			document.body.setAttribute("data-crisis-mode", "true");
		} else {
			document.body.removeAttribute("data-crisis-mode");
		}
	}, [isCrisisModeActive, theme]);

	if (isPending) {
		return <PageLoader />;
	}

	if (!user) {
		return <Navigate to="/signin" replace />;
	}

	return (
		<div className="flex min-h-dvh w-full overflow-hidden bg-background font-medium">
			<HelpOfferSnackbar />
			<SidebarDrawer />
			<div
				className={cn(
					"relative border-r border-border bg-surface",
					!isOpen ? "hidden" : "hidden 2xl:flex",
				)}
			>
				<Sidebar />
			</div>
			<div
				className={cn(
					"flex min-h-dvh w-full flex-1 overflow-hidden font-normal",
				)}
			>
				<Outlet />
			</div>
		</div>
	);
};
