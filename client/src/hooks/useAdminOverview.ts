import { hono } from "@client/lib/api/client";
import { useQuery } from "@tanstack/react-query";

type AdminOverviewData = {
	counts: {
		users: number;
		pulses: number;
		resources: number;
		reports: number;
		transactions: number;
		notifications: number;
	};
	recentReports: Array<{
		id: string;
		reason: string;
		status: string;
		createdAt: string;
		targetUserId: string | null;
		targetPulseId: string | null;
	}>;
	recentPulses: Array<{
		id: string;
		title: string;
		status: string;
		type: string;
		createdAt: string;
	}>;
	recentResources: Array<{
		id: string;
		name: string;
		availability: string;
		createdAt: string;
	}>;
};

export const useAdminOverview = () => {
	return useQuery({
		queryKey: ["admin", "overview"],
		queryFn: async () => {
			const res = await hono.api.admin.overview.$get();
			const json = (await res.json()) as {
				success: boolean;
				message: string;
				data: AdminOverviewData | null;
			};

			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to load admin overview");
			}

			return {
				...json.data,
				recentReports: json.data.recentReports.map((report) => ({
					...report,
					createdAt: report.createdAt,
				})),
				recentPulses: json.data.recentPulses.map((pulse) => ({
					...pulse,
					createdAt: pulse.createdAt,
				})),
				recentResources: json.data.recentResources.map((resource) => ({
					...resource,
					createdAt: resource.createdAt,
				})),
			};
		},
		retry: false,
	});
};
