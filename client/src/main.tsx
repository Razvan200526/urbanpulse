import "@fontsource/montserrat/100.css";
import "@fontsource/montserrat/200.css";
import "@fontsource/montserrat/300.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";
import { userAdditionalFields } from "@shared/auth/userAdditionalFields";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { PostHogProvider } from "@posthog/react";
import { client } from "@server/client.ts";
import { createAuthClient } from "better-auth/client";
import {
	adminClient,
	emailOTPClient,
	inferAdditionalFields,
} from "better-auth/client/plugins";
import { NuqsAdapter } from "nuqs/adapters/react-router";
import posthog from "posthog-js";
import { RouterProvider } from "react-router";
import { RootProvider } from "./components/RootProvider.tsx";
import { router } from "./router.tsx";
import { getApiOrigin } from "./utils/runtimeOrigin";

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
	api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
	defaults: "2026-01-30",
});

export const hono = client(getApiOrigin(), {
	init: {
		credentials: "include",
	},
});
export const authClient = createAuthClient({
	baseURL: getApiOrigin(),
	plugins: [
		inferAdditionalFields({ user: userAdditionalFields }),
		adminClient(),
		emailOTPClient(),
	],
});
export const queryClient = new QueryClient({});

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
