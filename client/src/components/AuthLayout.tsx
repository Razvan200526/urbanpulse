import { useAuth } from "@client/hooks/useAuth";
import { cn, Toast } from "@heroui/react";
import { Navigate, Outlet } from "react-router";
import { Loader } from "./Loader";
import { useAppSidebarStore } from "./sidebar/sidebarStore";
import { SidebarDrawer } from "./sidebar/SidebarDrawer";
import { Sidebar } from "./sidebar/Sidebar";

export const AuthLayout = () => {
	const { data: user, isError, isPending } = useAuth();
	const { isOpen } = useAppSidebarStore();
	if (isPending) {
		return <Loader />;
	}

	if (isError || !user) {
		Toast.toast.danger("An error occurred while authenticating.");
		return <Navigate to="/signin" replace />;
	}

	return (
		<div className="min-h-dvh flex flex-row font-medium bg-background">
			<SidebarDrawer />
			<div
				className={cn(
					"flex-1 border-r border-border relative w-64 shrink-0 flex-col gap-8 p-2 z-40 transition-all duration-300 ease-in-out",
					!isOpen ? "hidden" : "hidden 2xl:flex",
				)}
			>
				<Sidebar />
			</div>
			<div
				className={cn(
					"flex-1 min-h-dvh font-normal overflow-auto",
					isOpen ? "pl-54" : "",
				)}
			>
				<Outlet />
			</div>
		</div>
	);
};
