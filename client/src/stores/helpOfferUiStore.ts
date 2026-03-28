import { create } from "zustand";

export type PendingHelpOffer = {
	pulseId: string;
	responseId: string;
	message: string;
};

export const useHelpOfferUiStore = create<{
	pending: PendingHelpOffer | null;
	show: (p: PendingHelpOffer) => void;
	dismiss: () => void;
}>((set) => ({
	pending: null,
	show: (p) => set({ pending: p }),
	dismiss: () => set({ pending: null }),
}));
