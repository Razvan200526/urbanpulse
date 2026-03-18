import { authClient, hono } from "@client/main";
import { useMutation } from "@tanstack/react-query";
import { SignUpDataType } from "./signUpStore";

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

export const useSignUp = () => {
	return useMutation({
		mutationKey: ["signup"],
		mutationFn: async (data: SignUpDataType) => {
			const result = await authClient.signUp.email({
				email: data.email,
				password: data.password,
				image: data.image,
				name: data.name,
			});
			return result;
		},
	});
};
