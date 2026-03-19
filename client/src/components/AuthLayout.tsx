import { useAuth } from "@client/hooks/useAuth";
import { Toast } from "@heroui/react";
import { Navigate, Outlet } from "react-router";
import { Loader } from "./Loader";
import { useEffect } from "react";

export const AuthLayout = () => {
	const { data: user, isError, isPending } = useAuth();

	useEffect(() => {
		if (isError) {
			Toast.toast.danger("An error occurred while authenticating.");
		} else if (!isPending && !user && !isError) {
			Toast.toast.danger("You must be logged in to view this page.");
		}
	}, [isError, isPending, user]);

	if (isPending) {
		return <Loader />;
	}

	if (isError || !user) {
		return <Navigate to="/signin" replace />;
	}

	return (
		<div className="min-h-screen w-full bg-(--background)">
			<Outlet />
		</div>
	);
};
