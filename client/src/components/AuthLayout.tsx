import { useAuth } from "@client/hooks/useAuth";
import { useNotificationHook } from "@client/hooks/useNotificationHook";
import { cn, Toast } from "@heroui/react";
import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { PageLoader } from "./PageLoader";
import { Sidebar } from "./sidebar/Sidebar";
import { SidebarDrawer } from "./sidebar/SidebarDrawer";
import { useAppSidebarStore } from "./sidebar/sidebarStore";
import { useThemeStore } from "./sidebar/store";

export const AuthLayout = () => {
	const { data: user, isError, isPending } = useAuth();
	const { theme } = useThemeStore();
	const { isOpen } = useAppSidebarStore();

	useNotificationHook(user?.user.id);

	useEffect(() => {
		document.body.setAttribute("data-theme", theme);
	});

	if (isPending) {
		return <PageLoader />;
	}

	if (isError || (!isPending && !user)) {
		Toast.toast.danger("An error occurred while authenticating.");
		return <Navigate to="/signin" replace />;
	}

	return (
		<div className="w-full min-h-dvh flex flex-row font-medium bg-background">
			<SidebarDrawer />
			<div
				className={cn(
					"border-r border-border relative w-64 shrink-0 flex-col gap-8 p-2 transition-all duration-300 ease-in-out",
					!isOpen ? "hidden" : "hidden 2xl:flex",
				)}
			>
				<Sidebar />
			</div>
			<div className={cn("flex-1 min-h-dvh font-normal overflow-auto")}>
				<Outlet />
			</div>
		</div>
	);
};
