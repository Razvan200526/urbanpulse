import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/landing-page/LandingPage";
import { SignUpPage } from "./pages/signup/SignupPage";
export const router = createBrowserRouter([
	{
		path: "/",
		element: <LandingPage />,
	},
	{
		path: "/signup",
		element: <SignUpPage />,
	},
]);
