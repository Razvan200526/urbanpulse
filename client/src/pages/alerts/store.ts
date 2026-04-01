import { create } from "zustand";

export type AlertsFilterMode = "all" | "actionable" | "updates";

type AlertsPageStore = {
	filter: AlertsFilterMode;
	selectedAlertId: string | null;
	setFilter: (filter: AlertsFilterMode) => void;
	selectAlert: (selectedAlertId: string) => void;
	clearSelection: () => void;
};

export const useAlertsPageStore = create<AlertsPageStore>((set) => ({
	filter: "all",
	selectedAlertId: null,
	setFilter: (filter) => set({ filter }),
	selectAlert: (selectedAlertId) => set({ selectedAlertId }),
	clearSelection: () => set({ selectedAlertId: null }),
}));
