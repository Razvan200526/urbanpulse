import "@fontsource/montserrat/100.css";
import "@fontsource/montserrat/200.css";
import "@fontsource/montserrat/300.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router";
import { RootProvider } from "./components/RootProvider.tsx";
import { router } from "./router.tsx";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
		},
	},
});

const render = () => {
	const rootElement = document.getElementById("root");

	if (!rootElement) {
		throw new Error("Root element not found");
	}
	createRoot(rootElement).render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<RootProvider>
					<RouterProvider router={router} />
				</RootProvider>
			</QueryClientProvider>
		</StrictMode>,
	);
};

try {
	render();
} catch (e) {
	console.error(e);
}
