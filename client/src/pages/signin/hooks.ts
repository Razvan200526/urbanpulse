import { authClient } from "@client/main";
import { Toast } from "@heroui/react";
import type { SignInInfoType } from "@shared/validators/isSignInInfoValid";
import { useMutation } from "@tanstack/react-query";

export const useSignIn = () => {
	return useMutation({
		mutationKey: ["sign-in"],
		mutationFn: async (payload: SignInInfoType) => {
			const { data, error } = await authClient.signIn.email({
				email: payload.email,
				password: payload.password,
			});
			if (error?.message) {
				Toast.toast.danger(error.message);
			}
			return data;
		},
	});
};
