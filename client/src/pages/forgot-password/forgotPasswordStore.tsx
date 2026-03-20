import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ForgotPasswordDataType = {
	email: string;
	step: number;
	otp: string;
};

export type ForgotPasswordStoreType = {
	otp: string;
	email: string;
	step: number;
	setOtp: (otp: string) => void;
	setEmail: (email: string) => void;
	setStep: (step: number) => void;
	clear: () => void;
};

const DEFAULT_DATA = {
	email: "",
	step: 0,
};

export const useForgotPasswordStore = create<ForgotPasswordStoreType>()(
	persist(
		(set) => ({
			...DEFAULT_DATA,
			otp: "",
			setOtp: (otp: string) => set({ otp }),
			setEmail: (email: string) => set({ email }),
			setStep: (step: number) => set({ step }),
			clear: () => set(DEFAULT_DATA),
		}),
		{
			name: "forgot-password-store",
		},
	),
);
