import { useAuth } from "@client/hooks/useAuth";
import { Toast } from "@heroui/react";
import { Navigate, Outlet } from "react-router";
import { Loader } from "./Loader";

export const AuthLayout = () => {
	const { data: user, isError, isPending } = useAuth();

	if (isPending) {
		return <Loader />;
	}

	if (isError || !user) {
		Toast.toast.danger("An error occurred while authenticating.");
		return <Navigate to="/signin" replace />;
	}

	return (
		<div className="min-h-screen w-full bg-background">
			<Outlet />
		</div>
	);
};
