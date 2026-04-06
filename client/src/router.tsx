import { ErrorBoundary } from "react-error-boundary";
import { createBrowserRouter, Outlet } from "react-router";
import { AuthLayout } from "./components/AuthLayout";
import { ErrorFallback } from "./components/ErrorFallback";
import { AdminPage } from "./pages/admin/AdminPage";
import { AlertsPage } from "./pages/alerts/AlertsPage";
import { DashboardPages } from "./pages/dashboard/DashboardPage";
import { ForgotPasswordPage } from "./pages/forgot-password/ForgotPasswordPage";
import { LandingPage } from "./pages/landing-page/LandingPage";
import { MapPage } from "./pages/map/MapPage";
import { MessagesPage } from "./pages/messages/MessagesPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { ResourcesPage } from "./pages/resources/ResourcesPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { SignInPage } from "./pages/signin/SigninPage";
import { SignUpPage } from "./pages/signup/SignupPage";

export const ErrorBoundaryLayout = () => (
	<ErrorBoundary FallbackComponent={ErrorFallback}>
		<Outlet />
	</ErrorBoundary>
);
export const router = createBrowserRouter([
	{
		element: <ErrorBoundaryLayout />,
		children: [
			{
				path: "/",
				element: <LandingPage />,
			},
			{
				path: "/signup",
				element: <SignUpPage />,
			},
			{
				path: "/signin",
				element: <SignInPage />,
			},
			{
				path: "/forgot-password",
				element: <ForgotPasswordPage />,
			},
			{
				element: <AuthLayout />,
				children: [
					{
						path: "/dashboard",
						element: <DashboardPages />,
					},
					{
						path: "/map",
						element: <MapPage />,
					},
					{
						path: "/resources",
						element: <ResourcesPage />,
					},
					{
						path: "/alerts",
						element: <AlertsPage />,
					},
					{
						path: "/messages",
						element: <MessagesPage />,
					},
					{
						path: "/messages/:conversationId",
						element: <MessagesPage />,
					},
					{
						path: "/admin",
						element: <AdminPage />,
					},
					{
						path: "/settings",
						element: <SettingsPage />,
					},
					{
						path: "/profile",
						element: <ProfilePage />,
					},
				],
			},
		],
	},
]);
