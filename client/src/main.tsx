import "@fontsource/montserrat/100.css";
import "@fontsource/montserrat/200.css";
import "@fontsource/montserrat/300.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { PostHogProvider } from "@posthog/react";
import { NuqsAdapter } from "nuqs/adapters/react-router";
import posthog from "posthog-js";
import { RouterProvider } from "react-router";
import { RootProvider } from "./components/RootProvider.tsx";
import { queryClient } from "./lib/api/client";
import { router } from "./router.tsx";

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN as string, {
	api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string,
	defaults: "2026-01-30",
});

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found");
}
const root = createRoot(rootElement);
root.render(
	<StrictMode>
		<PostHogProvider client={posthog}>
			<QueryClientProvider client={queryClient}>
				<RootProvider>
					<NuqsAdapter>
						<RouterProvider router={router} />
					</NuqsAdapter>
				</RootProvider>
			</QueryClientProvider>
		</PostHogProvider>
	</StrictMode>,
);
