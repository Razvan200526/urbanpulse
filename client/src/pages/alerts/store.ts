import { create } from "zustand";

export type AlertsFilter = "all" | "actionable" | "updates";

type AlertsPageStore = {
	filter: AlertsFilter;
	setFilter: (filter: AlertsFilter) => void;
};

export const useAlertsPageStore = create<AlertsPageStore>((set) => ({
	filter: "all",
	setFilter: (filter) => set({ filter }),
}));
