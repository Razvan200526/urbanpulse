import { hono, queryClient } from "@client/main";
import { PulseStatusEnum, ReportStatusEnum } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";

type ConfirmPulseResponse = {
	success: boolean;
	message: string;
	data: {
		pulse: {
			id: string;
			isVerified: boolean | null;
			status: string;
		};
		confirmationCount: number;
		alreadyConfirmed: boolean;
		newlyVerified: boolean;
	} | null;
};

type CreateReportResponse = {
	success: boolean;
	message: string;
	data: {
		report: {
			id: string;
			status: string;
			reason: string;
		};
	} | null;
};

type AdminReportsResponse = {
	success: boolean;
	message: string;
	data: {
		reports: Array<{
			id: string;
			reason: string;
			status: string;
			createdAt: string;
			reporter: {
				id: string;
				name: string;
				email: string;
				role: string | null;
			} | null;
			targetUser: {
				id: string;
				name: string;
				email: string;
				role: string | null;
			} | null;
			targetPulse: {
				id: string;
				title: string;
				status: string;
				type: string;
				isVerified: boolean | null;
			} | null;
		}>;
	} | null;
};

type ReviewReportResponse = {
	success: boolean;
	message: string;
	data: {
		report: {
			id: string;
			status: string;
		};
		pulse: {
			id: string;
			status: string;
			isResolved: boolean;
		} | null;
	} | null;
};

export const useConfirmPulse = () => {
	return useMutation({
		mutationKey: ["pulse", "confirm"],
		mutationFn: async ({ pulseId }: { pulseId: string }) => {
			const res = await hono.api.pulse[":id"].confirm.$post({
				param: { id: pulseId },
			});
			const json = (await res.json()) as ConfirmPulseResponse;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to confirm pulse");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});
};

export const useCreateReport = () => {
	return useMutation({
		mutationKey: ["report", "create"],
		mutationFn: async (payload: {
			reason: string;
			targetPulseId?: string;
			targetUserId?: string;
		}) => {
			const res = await hono.api.reports.$post({
				json: payload,
			});
			const json = (await res.json()) as CreateReportResponse;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to submit report");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
		},
	});
};

export const useAdminReports = () => {
	return useQuery({
		queryKey: ["admin", "reports"],
		queryFn: async () => {
			const res = await hono.api.admin.reports.$get();
			const json = (await res.json()) as AdminReportsResponse;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to load reports");
			}
			return json.data.reports;
		},
		retry: false,
	});
};

export const useReviewReport = () => {
	return useMutation({
		mutationKey: ["admin", "reports", "review"],
		mutationFn: async ({
			reportId,
			status,
			pulseStatus,
		}: {
			reportId: string;
			status: ReportStatusEnum.Resolved | ReportStatusEnum.Dismissed;
			pulseStatus?: PulseStatusEnum;
		}) => {
			const res = await hono.api.admin.reports[":id"].$patch({
				param: { id: reportId },
				json: {
					status,
					pulseStatus,
				},
			});
			const json = (await res.json()) as ReviewReportResponse;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to review report");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
		},
	});
};
