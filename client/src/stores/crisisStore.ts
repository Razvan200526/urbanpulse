import type { ClientClusterType } from "@client/utils/clusterTypes";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CrisisStore {
	/** List of clusters that are currently in 'crisis' status */
	activeCrises: ClientClusterType[];
	/** Globally indicates if at least one crisis is active for the user */
	isCrisisModeActive: boolean;
	/** Updates the list of active crises and syncs the global status */
	setActiveCrises: (crises: ClientClusterType[]) => void;
	/** Adds a single crisis to the list (e.g. from a WebSocket event) */
	addCrisis: (crisis: ClientClusterType) => void;
	/** Removes a crisis by ID */
	removeCrisis: (id: string) => void;
	/** Resets the store */
	clearCrises: () => void;
}

export const useCrisisStore = create<CrisisStore>()(
	persist(
		(set) => ({
			activeCrises: [],
			isCrisisModeActive: false,

			setActiveCrises: (crises) => {
				const filtered = crises.filter(
					(c) => c.status === "crisis" || c.status === "active",
				);
				set({
					activeCrises: filtered,
					isCrisisModeActive: filtered.length > 0,
				});
			},

			addCrisis: (crisis) => {
				if (crisis.status !== "crisis") return;

				set((state) => {
					const exists = state.activeCrises.some((c) => c.id === crisis.id);
					if (exists) return state;

					const newCrises = [...state.activeCrises, crisis];
					return {
						activeCrises: newCrises,
						isCrisisModeActive: true,
					};
				});
			},

			removeCrisis: (id) => {
				set((state) => {
					const newCrises = state.activeCrises.filter((c) => c.id !== id);
					return {
						activeCrises: newCrises,
						isCrisisModeActive: newCrises.length > 0,
					};
				});
			},

			clearCrises: () => set({ activeCrises: [], isCrisisModeActive: false }),
		}),
		{
			name: "crisis-storage",
		},
	),
);
