import { hono } from "@client/main";
import { useMutation } from "@tanstack/react-query";

export const useVerifyEmail = () => {
	return useMutation({
		mutationKey: ["verifyEmail"],
		mutationFn: async (email: string) => {
			const data = await hono.api.users[`verify-email`].$get({
				query: { email },
			});
			if (!data.ok) {
				throw new Error("Failed to verify email");
			}
			return data.json();
		},
	});
};

export const useSignUp = () => {};
