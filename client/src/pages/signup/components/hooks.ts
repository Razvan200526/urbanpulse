import { hono } from "@client/main";
import { useMutation } from "@tanstack/react-query";

export const useVerifyEmail = (email: string) => {
	return useMutation({
		mutationKey: ["verifyEmail", email],
		mutationFn: async () => {
			const data = await hono.api.users["verify-email"].$get({ email: email });
			if (data.ok) {
				return data.json();
			}
		},
	});
};
