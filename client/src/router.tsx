import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/landing-page/LandingPage";
export const router = createBrowserRouter([
	{
		path: "/",
		element: <LandingPage />,
	},
]);
