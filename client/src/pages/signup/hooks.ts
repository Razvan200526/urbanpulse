import { authQueryKey, fetchAuthSession } from "@client/hooks/useAuth";
import { authClient, hono, queryClient } from "@client/main";
import { Toast } from "@heroui/react";
import { isSignUpInfoValid } from "@shared/validators/isSignUpInfoValid";
import { useMutation } from "@tanstack/react-query";
import { buildSignUpPayload } from "./signUpPayload";
import type { SignUpDataType } from "./signUpStore";

export const useVerifyEmail = () => {
	return useMutation({
		mutationKey: ["verifyEmail"],
		mutationFn: async (email: string) => {
			const data = await hono.api.users[`verify-email`].$get({
				query: { email },
			});
			const res = await data.json();
			if (!res.success || res.exists) {
				Toast.toast.danger(res.message);
				return;
			}
			return res;
		},
	});
};

export const useSignUp = () => {
	return useMutation({
		mutationKey: ["signup"],
		mutationFn: async (data: SignUpDataType) => {
			const payload = buildSignUpPayload(data);
			if (!isSignUpInfoValid(payload)) {
				Toast.toast.danger("Please complete your profile before signing up.");
				return null;
			}

			const result = await authClient.signUp.email({
				email: payload.email,
				password: payload.password,
				image: payload.image,
				name: payload.name,
				bio: payload.bio,
			});

			if (!result.data?.user || result.error) {
				Toast.toast.danger(
					result.error?.message || "Sign up failed,try again later",
				);
				return null;
			}
			return result.data.user;
		},
	});
};

type VerifyOTPInput = {
	email: string;
	otp: string;
};
export const useVerifyOTP = () => {
	return useMutation({
		mutationKey: ["verifyOTP"],
		mutationFn: async ({ email, otp }: VerifyOTPInput) => {
			const { data } = await authClient.emailOtp.verifyEmail({
				email,
				otp,
			});
			if (!data?.user) {
				Toast.toast.danger("Could not verify OTP");
				return;
			}

			await queryClient.invalidateQueries({ queryKey: authQueryKey });
			const session = await queryClient.fetchQuery({
				queryKey: authQueryKey,
				queryFn: fetchAuthSession,
			});

			if (!session?.user) {
				Toast.toast.danger("Email verified, but your session was not created.");
				return;
			}

			return session.user;
		},
	});
};
