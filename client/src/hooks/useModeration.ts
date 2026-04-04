import { authClient, hono, queryClient } from "@client/main";
import type { PulseStatusEnum, ReportStatusEnum } from "@shared/types";
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
				description: string | null;
				status: string;
				type: string;
				isVerified: boolean | null;
				moderationNote?: string | null;
			} | null;
		}>;
	} | null;
};

type AdminDuplicatePulsesResponse = {
	success: boolean;
	message: string;
	data: {
		duplicates: Array<{
			sourcePulse: {
				id: string;
				title: string;
				description: string | null;
				status: string;
				type: string;
				isVerified: boolean | null;
				createdAt: string;
			};
			targetPulse: {
				id: string;
				title: string;
				description: string | null;
				status: string;
				type: string;
				isVerified: boolean | null;
				createdAt: string;
			};
			distanceMeters: number;
			hoursApart: number;
			titleSimilarity: number;
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

type ModeratePulseResponse = {
	success: boolean;
	message: string;
	data: {
		pulse: {
			id: string;
			status: string;
			isResolved: boolean;
			isVerified: boolean | null;
			moderationNote: string | null;
		};
	} | null;
};

type MergePulseResponse = {
	success: boolean;
	message: string;
	data: {
		sourcePulse: {
			id: string;
			mergedIntoPulseId: string | null;
		};
		targetPulse: {
			id: string;
			isVerified: boolean | null;
		};
	} | null;
};

export type AdminUserListItem = {
	id: string;
	name: string;
	email: string;
	role: string | string[] | null;
	banned?: boolean;
	banReason?: string | null;
	banExpires?: string | null;
};

export type AdminUserSession = {
	id?: string;
	token?: string;
	expiresAt?: string;
	createdAt?: string;
	ipAddress?: string | null;
	userAgent?: string | null;
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

export const useAdminDuplicatePulses = () => {
	return useQuery({
		queryKey: ["admin", "duplicates"],
		queryFn: async () => {
			const res = await hono.api.admin.duplicates.$get();
			const json = (await res.json()) as AdminDuplicatePulsesResponse;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to load duplicate pulses");
			}
			return json.data.duplicates;
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
			pulseVerification,
			moderationNote,
		}: {
			reportId: string;
			status: ReportStatusEnum.Resolved | ReportStatusEnum.Dismissed;
			pulseStatus?: PulseStatusEnum;
			pulseVerification?: boolean;
			moderationNote?: string;
		}) => {
			const res = await hono.api.admin.reports[":id"].$patch({
				param: { id: reportId },
				json: {
					status,
					pulseStatus,
					pulseVerification,
					moderationNote,
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

export const useModeratePulse = () => {
	return useMutation({
		mutationKey: ["admin", "pulse", "moderate"],
		mutationFn: async ({
			pulseId,
			status,
			isVerified,
			moderationNote,
		}: {
			pulseId: string;
			status?: PulseStatusEnum;
			isVerified?: boolean;
			moderationNote?: string;
		}) => {
			const res = await hono.api.admin.pulses[":id"].$patch({
				param: { id: pulseId },
				json: {
					status,
					isVerified,
					moderationNote,
				},
			});
			const json = (await res.json()) as ModeratePulseResponse;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to moderate pulse");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "duplicates"] });
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
		},
	});
};

export const useMergePulse = () => {
	return useMutation({
		mutationKey: ["admin", "pulse", "merge"],
		mutationFn: async ({
			sourcePulseId,
			targetPulseId,
			reason,
		}: {
			sourcePulseId: string;
			targetPulseId: string;
			reason: string;
		}) => {
			const res = await hono.api.admin.pulses.merge.$post({
				json: {
					sourcePulseId,
					targetPulseId,
					reason,
				},
			});
			const json = (await res.json()) as MergePulseResponse;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to merge pulses");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
			queryClient.invalidateQueries({ queryKey: ["admin", "duplicates"] });
			queryClient.invalidateQueries({ queryKey: ["pulse", "retrieve"] });
		},
	});
};

const normalizeAdminUsers = (payload: unknown): AdminUserListItem[] => {
	if (Array.isArray(payload)) {
		return payload as AdminUserListItem[];
	}

	if (
		payload &&
		typeof payload === "object" &&
		"users" in payload &&
		Array.isArray((payload as { users?: unknown[] }).users)
	) {
		return (payload as { users: AdminUserListItem[] }).users;
	}

	return [];
};

const normalizeSessions = (payload: unknown): AdminUserSession[] => {
	if (Array.isArray(payload)) {
		return payload as AdminUserSession[];
	}

	if (
		payload &&
		typeof payload === "object" &&
		"sessions" in payload &&
		Array.isArray((payload as { sessions?: unknown[] }).sessions)
	) {
		return (payload as { sessions: AdminUserSession[] }).sessions;
	}

	return [];
};

export const useAdminUsers = (searchValue: string) => {
	return useQuery({
		queryKey: ["admin", "users", searchValue],
		queryFn: async () => {
			const { data, error } = await authClient.admin.listUsers({
				query: {
					searchField: "email",
					searchOperator: "contains",
					searchValue: searchValue || undefined,
					limit: 20,
				},
			});

			if (error) {
				throw new Error(error.message || "Failed to load users");
			}

			return normalizeAdminUsers(data);
		},
		retry: false,
	});
};

export const useAdminUserSessions = (userId: string | null) => {
	return useQuery({
		queryKey: ["admin", "user-sessions", userId],
		enabled: Boolean(userId),
		queryFn: async () => {
			if (!userId) {
				return [];
			}

			const { data, error } = await authClient.admin.listUserSessions({
				userId,
			});

			if (error) {
				throw new Error(error.message || "Failed to load user sessions");
			}

			return normalizeSessions(data);
		},
		retry: false,
	});
};

export const useAdminSetRole = () => {
	return useMutation({
		mutationKey: ["admin", "users", "role"],
		mutationFn: async ({
			userId,
			role,
		}: {
			userId: string;
			role: "admin" | "user";
		}) => {
			const { data, error } = await authClient.admin.setRole({
				userId,
				role,
			});

			if (error) {
				throw new Error(error.message || "Failed to update role");
			}

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
		},
	});
};

export const useAdminBanUser = () => {
	return useMutation({
		mutationKey: ["admin", "users", "ban"],
		mutationFn: async ({
			userId,
			banReason,
		}: {
			userId: string;
			banReason: string;
		}) => {
			const { data, error } = await authClient.admin.banUser({
				userId,
				banReason,
			});

			if (error) {
				throw new Error(error.message || "Failed to ban user");
			}

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
		},
	});
};

export const useAdminUnbanUser = () => {
	return useMutation({
		mutationKey: ["admin", "users", "unban"],
		mutationFn: async ({ userId }: { userId: string }) => {
			const { data, error } = await authClient.admin.unbanUser({
				userId,
			});

			if (error) {
				throw new Error(error.message || "Failed to unban user");
			}

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
		},
	});
};

export const useAdminRevokeUserSession = () => {
	return useMutation({
		mutationKey: ["admin", "users", "revoke-session"],
		mutationFn: async ({ sessionToken }: { sessionToken: string }) => {
			const { data, error } = await authClient.admin.revokeUserSession({
				sessionToken,
			});

			if (error) {
				throw new Error(error.message || "Failed to revoke session");
			}

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "user-sessions"] });
		},
	});
};
