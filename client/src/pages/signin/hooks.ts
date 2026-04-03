import { authQueryKey, fetchAuthSession } from "@client/hooks/useAuth";
import { authClient, queryClient } from "@client/main";
import { buildAppUrl } from "@client/utils/runtimeOrigin";
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
				return null;
			}

			if (!data) {
				return null;
			}

			await queryClient.invalidateQueries({ queryKey: authQueryKey });
			const session = await queryClient.fetchQuery({
				queryKey: authQueryKey,
				queryFn: fetchAuthSession,
			});

			if (!session?.user) {
				Toast.toast.danger(
					"Sign in completed, but your session was not created.",
				);
				return null;
			}

			return session;
		},
	});
};

export type SocialProviderType = "github" | "google";

export const useSignInSocial = () => {
	return useMutation({
		mutationKey: ["sign-in-social"],
		mutationFn: async (provider: SocialProviderType) => {
			const { data, error } = await authClient.signIn.social({
				provider: provider,
				callbackURL: buildAppUrl("/map"),
			});
			if (error?.message) {
				Toast.toast.danger(error.message);
			}
			return data;
		},
	});
};
