import { hono } from "@client/lib/api/client";
import { useQuery } from "@tanstack/react-query";

export type DashboardOverviewData = {
	counts: {
		pulsesLast7Days: number;
		emergencyPulsesLast7Days: number;
		newUsersLast7Days: number;
		alertsLast7Days: number;
	};
	changes: {
		pulsesLast7Days: number;
		emergencyPulsesLast7Days: number;
		newUsersLast7Days: number;
		alertsLast7Days: number;
	};
	chart: Array<{
		date: string;
		label: string;
		pulses: number;
		alerts: number;
	}>;
};

export const useDashboardOverview = () => {
	return useQuery({
		queryKey: ["dashboard", "overview"],
		queryFn: async () => {
			const res = await hono.api.dashboard.overview.$get();
			const json = (await res.json()) as {
				success: boolean;
				message: string;
				data: DashboardOverviewData | null;
			};

			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to load dashboard overview");
			}

			return json.data;
		},
		retry: false,
	});
};
