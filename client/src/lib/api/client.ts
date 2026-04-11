import { getApiOrigin } from "@client/utils/runtimeOrigin";
import { client } from "@server/client.ts";
import { userAdditionalFields } from "@shared/auth/userAdditionalFields";
import { QueryClient } from "@tanstack/react-query";
import { createAuthClient } from "better-auth/client";
import {
	adminClient,
	emailOTPClient,
	inferAdditionalFields,
} from "better-auth/client/plugins";

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
