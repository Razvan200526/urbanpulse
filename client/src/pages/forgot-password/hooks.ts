import { authClient } from "@client/lib/api/client";
import { Toast } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";

export const useSendForgotPassowrdOtp = () => {
	return useMutation({
		mutationKey: ["forgot-password-otp"],
		mutationFn: async ({ email }: { email: string }) => {
			const { data, error } = await authClient.emailOtp.requestPasswordReset({
				email,
			});
			if (error) {
				Toast.toast.danger(error.message);
			}
			return data;
		},
	});
};

export const useVerifyOtp = () => {
	return useMutation({
		mutationKey: ["verify-otp"],
		mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
			const { data, error } = await authClient.emailOtp.checkVerificationOtp({
				email,
				otp,
				type: "forget-password",
			});
			if (error) {
				Toast.toast.danger(error.message);
			}
			return data;
		},
	});
};

export const useResetPassword = () => {
	return useMutation({
		mutationKey: ["reset-password"],
		mutationFn: async ({
			email,
			password,
			otp,
		}: {
			email: string;
			password: string;
			otp: string;
		}) => {
			const { data, error } = await authClient.emailOtp.resetPassword({
				email,
				password,
				otp,
			});
			if (error) {
				Toast.toast.danger(error.message);
			}
			return data;
		},
	});
};
