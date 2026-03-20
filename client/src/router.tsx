import { createBrowserRouter } from "react-router";
import { AuthLayout } from "./components/AuthLayout";
import { LandingPage } from "./pages/landing-page/LandingPage";
import { SignUpPage } from "./pages/signup/SignupPage";
import { HomePage } from "./pages/home/HomePage";
import { SignInPage } from "./pages/signin/SigninPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { MapPage } from "./pages/map/MapPage";
import { ResourcesPage } from "./pages/resources/ResourcesPage";
import { AlertsPage } from "./pages/alerts/AlertsPage";
import { MessagesPage } from "./pages/messages/MessagesPage";
import { AdminPage } from "./pages/admin/AdminPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { ForgotPasswordPage } from "./pages/forgot-password/ForgotPasswordPage";

export const router = createBrowserRouter([
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
				element: <DashboardPage />,
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
]);
