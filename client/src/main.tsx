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
import { userAdditionalFields } from "@shared/auth/userAdditionalFields";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { client } from "@server/client.ts";
import { createAuthClient } from "better-auth/client";
import {
	emailOTPClient,
	inferAdditionalFields,
} from "better-auth/client/plugins";
import { NuqsAdapter } from "nuqs/adapters/react-router";
import { RouterProvider } from "react-router";
import { RootProvider } from "./components/RootProvider.tsx";
import { router } from "./router.tsx";
import { getApiOrigin } from "./utils/runtimeOrigin";

export const hono = client(getApiOrigin(), {
	init: {
		credentials: "include",
	},
});
export const authClient = createAuthClient({
	baseURL: getApiOrigin(),
	plugins: [inferAdditionalFields({ user: userAdditionalFields }), emailOTPClient()],
});
export const queryClient = new QueryClient({});

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element not found");
}
const root = createRoot(rootElement);
root.render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<RootProvider>
				<NuqsAdapter>
					<RouterProvider router={router} />
				</NuqsAdapter>
			</RootProvider>
		</QueryClientProvider>
	</StrictMode>,
);
