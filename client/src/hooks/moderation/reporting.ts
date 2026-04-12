import { hono, queryClient } from "@client/lib/api/client";
import { parseApiData, parseApiEnvelope } from "@client/lib/api/parse";
import { Toast } from "@heroui/react";
import type { PulseStatusEnum, ReportStatusEnum } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { InferRequestType } from "hono/client";
import { z } from "zod";
import {
	adminDuplicatePulseSchema,
	adminReportSchema,
	confirmPulseResultSchema,
	createReportResultSchema,
	mergePulseResultSchema,
	moderatePulseResultSchema,
	reviewReportResultSchema,
} from "./schemas";

const pulseByIdRoute = hono.api.pulse[":id"];
const adminReportByIdRoute = hono.api.admin.reports[":id"];
const adminPulseByIdRoute = hono.api.admin.pulses[":id"];

type ConfirmPulseInput = InferRequestType<
	typeof pulseByIdRoute.confirm.$post
>["param"];

type CreateReportInput = InferRequestType<
	typeof hono.api.reports.$post
>["json"];

type ReviewReportInput = InferRequestType<typeof adminReportByIdRoute.$patch>;

type ModeratePulseInput = InferRequestType<typeof adminPulseByIdRoute.$patch>;

type MergePulseInput = InferRequestType<
	typeof hono.api.admin.pulses.merge.$post
>["json"];

const confirmPulse = async ({ id }: ConfirmPulseInput) => {
	const response = await hono.api.pulse[":id"].confirm.$post({
		param: { id },
	});

	return parseApiEnvelope(
		response,
		confirmPulseResultSchema,
		"Failed to confirm pulse",
	);
};

const createReport = async (payload: CreateReportInput) => {
	const response = await hono.api.reports.$post({
		json: payload,
	});

	return parseApiEnvelope(
		response,
		createReportResultSchema,
		"Failed to submit report",
	);
};

const fetchAdminReports = async () => {
	const response = await hono.api.admin.reports.$get();
	const parsed = await parseApiData(
		response,
		z.object({ reports: z.array(adminReportSchema) }),
		"Failed to load reports",
	);

	return parsed?.data.reports;
};

const fetchAdminDuplicatePulses = async () => {
	const response = await hono.api.admin.duplicates.$get();
	const parsed = await parseApiData(
		response,
		z.object({ duplicates: z.array(adminDuplicatePulseSchema) }),
		"Failed to load duplicate pulses",
	);

	return parsed?.data.duplicates;
};

const reviewReport = async ({ param, json }: ReviewReportInput) => {
	const response = await hono.api.admin.reports[":id"].$patch({
		param,
		json,
	});

	return parseApiEnvelope(
		response,
		reviewReportResultSchema,
		"Failed to review report",
	);
};

const moderatePulse = async ({ param, json }: ModeratePulseInput) => {
	const response = await hono.api.admin.pulses[":id"].$patch({
		param,
		json,
	});

	return parseApiEnvelope(
		response,
		moderatePulseResultSchema,
		"Failed to moderate pulse",
	);
};

const mergePulse = async (payload: MergePulseInput) => {
	const response = await hono.api.admin.pulses.merge.$post({
		json: payload,
	});

	return parseApiEnvelope(
		response,
		mergePulseResultSchema,
		"Failed to merge pulses",
	);
};

const invalidateModerationQueries = () => {
	queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
	queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
	queryClient.invalidateQueries({ queryKey: ["admin", "duplicates"] });
	queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
};

export const useConfirmPulse = () => {
	return useMutation({
		mutationKey: ["pulse", "confirm"],
		mutationFn: async ({ pulseId }: { pulseId: string }) => {
			const res = await confirmPulse({ id: pulseId });
			if (res.success) {
				Toast.toast.success("Pulse confirmed successfully");
			}
			return res;
		},
		onSuccess: (result) => {
			if (!result.success) {
				return;
			}
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});
};

export const useCreateReport = () => {
	return useMutation({
		mutationKey: ["report", "create"],
		mutationFn: createReport,
		onSuccess: (result) => {
			if (!result.success) {
				return;
			}
			queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
		},
	});
};

export const useAdminReports = () => {
	return useQuery({
		queryKey: ["admin", "reports"],
		queryFn: fetchAdminReports,
		retry: false,
	});
};

export const useAdminDuplicatePulses = () => {
	return useQuery({
		queryKey: ["admin", "duplicates"],
		queryFn: fetchAdminDuplicatePulses,
		retry: false,
	});
};

export const useReviewReport = () => {
	return useMutation({
		mutationKey: ["admin", "reports", "review"],
		mutationFn: ({
			reportId,
			status,
			pulseStatus,
			pulseVerification,
			moderationNote,
		}: {
			reportId: string;
			status: ReportStatusEnum.Resolved | ReportStatusEnum.Dismissed;
			pulseStatus?: PulseStatusEnum;
			pulseVerification?: boolean;
			moderationNote?: string;
		}) =>
			reviewReport({
				param: { id: reportId },
				json: {
					status,
					pulseStatus,
					pulseVerification,
					moderationNote,
				},
			}),
		onSuccess: (result) => {
			if (!result.success) {
				return;
			}
			invalidateModerationQueries();
		},
	});
};

export const useModeratePulse = () => {
	return useMutation({
		mutationKey: ["admin", "pulse", "moderate"],
		mutationFn: ({
			pulseId,
			status,
			isVerified,
			moderationNote,
		}: {
			pulseId: string;
			status?: PulseStatusEnum;
			isVerified?: boolean;
			moderationNote?: string;
		}) =>
			moderatePulse({
				param: { id: pulseId },
				json: {
					status,
					isVerified,
					moderationNote,
				},
			}),
		onSuccess: (result) => {
			if (!result.success) {
				return;
			}
			invalidateModerationQueries();
		},
	});
};

export const useMergePulse = () => {
	return useMutation({
		mutationKey: ["admin", "pulse", "merge"],
		mutationFn: mergePulse,
		onSuccess: (result) => {
			if (!result.success) {
				return;
			}
			invalidateModerationQueries();
		},
	});
};
