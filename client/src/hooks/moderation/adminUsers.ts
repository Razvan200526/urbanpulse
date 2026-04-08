import { authClient, queryClient } from "@client/lib/api/client";
import { parseValueWithSchema } from "@client/lib/api/parse";
import { useMutation, useQuery } from "@tanstack/react-query";
import { adminUserSessionsSchema, adminUsersSchema } from "./schemas";

const normalizeAdminUsers = (payload: unknown) => {
	const parsed = parseValueWithSchema(
		payload,
		adminUsersSchema,
		"Failed to load users",
	);

	return Array.isArray(parsed) ? parsed : parsed.users;
};

const normalizeSessions = (payload: unknown) => {
	const parsed = parseValueWithSchema(
		payload,
		adminUserSessionsSchema,
		"Failed to load user sessions",
	);

	return Array.isArray(parsed) ? parsed : parsed.sessions;
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
