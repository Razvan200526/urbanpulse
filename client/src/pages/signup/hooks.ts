import { authClient, hono } from "@client/main";
import { Toast } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
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
			const result = await authClient.signUp.email({
				email: data.email,
				password: data.password,
				image: data.image,
				name: data.name,
				// @ts-expect-error - Custom field handled by our custom signUp plugin
				bio: data.bio,
			});
			if (!result.data?.user || result.error) {
				Toast.toast.danger(
					result.error?.message || "Sign up failed,try again later",
				);
			}
			return result;
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
			return data.user;
		},
	});
};
