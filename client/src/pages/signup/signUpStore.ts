import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SignUpDataType = {
	email: string;
	name: string;
	image: string;
	password: string;
	bio: string;
};

type SignupStoreType = {
	step: number;
	setStep: (step: number) => void;
	data: SignUpDataType;
	setData: (data: SignUpDataType) => void;
	clear: () => void;
};

const DEFAULT_DATA: SignUpDataType = {
	email: "",
	password: "",
	name: "",
	image: "",
	bio: "",
};
export const useSignupStore = create<SignupStoreType>()(
	persist(
		(set) => ({
			step: 0,
			setStep: (step: number) => set({ step }),
			data: DEFAULT_DATA,
			setData: (data: SignUpDataType) => set({ data }),
			clear: () => {
				set({
					step: 0,
					data: DEFAULT_DATA,
				});
			},
		}),
		{
			name: "signup-store",
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);
