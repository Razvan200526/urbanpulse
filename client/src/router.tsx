import { createBrowserRouter } from "react-router";
import { AuthLayout } from "./components/AuthLayout";
import { LandingPage } from "./pages/landing-page/LandingPage";
import { SignUpPage } from "./pages/signup/SignupPage";
import { HomePage } from "./pages/home/HomePage";
import { SignInPage } from "./pages/signin/SigninPage";

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
		element: <AuthLayout />,
		children: [
			{
				path: "/home",
				element: <HomePage />,
			},
		],
	},
]);
