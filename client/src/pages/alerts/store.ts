import { create } from "zustand";

export type AlertsFilter = "all" | "actionable" | "updates";

type AlertsPageStore = {
	filter: AlertsFilter;
	selectedAlertId: string | null;
	setFilter: (filter: AlertsFilter) => void;
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
