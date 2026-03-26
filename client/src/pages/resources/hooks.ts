import { hono, queryClient } from "@client/main";
import type { ClientUserType } from "@client/utils/types";
import type { ResourceType } from "@server/db/schema";
import { Toast } from "@heroui/react";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useUploadResource = (userId: string) => {
	return useMutation({
		mutationKey: ["upload", "resource", userId],
		mutationFn: async (resource: {
			userId: string;
			availability: string;
			name: string;
			description: string;
		}) => {
			const response = await hono.api.resources.$post({ json: resource });
			const res = await response.json();
			if (!res.success || !res.data) {
				Toast.toast.danger(res.message);
				return;
			}
			return res;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["retrieve", "resources", userId],
			});
		},
	});
};
export const useGetResourceAuthor = (resourceId: string) => {
	return useQuery({
		queryKey: ["author", resourceId],
		queryFn: async () => {
			const response = await hono.api.resources[":resourceId"].author.$get({
				param: {
					resourceId,
				},
			});
			const res = await response.json();
			if (!res.success || !res.data) {
				Toast.toast.danger(res.message);
				return;
			}
			return res.data as ClientUserType;
		},
	});
};
export type ResourceWithUsersType = {
	resource: ResourceType;
	recentUsers: Array<Pick<ClientUserType, "id" | "name" | "image">>;
};

export const useRetrieveResources = (userId: string) => {
	return useQuery({
		queryKey: ["retrieve", "resources", userId],
		queryFn: async () => {
			const response = await hono.api.resources.$get({
				query: {
					userId,
				},
			});
			const res = await response.json();
			if (!res.success || !res.data) {
				Toast.toast.danger(res.message);
				return;
			}
			return res.data.map((item: any) => ({
				resource: {
					...item.resource,
					createdAt: new Date(item.resource.createdAt),
				},
				recentUsers: item.recentUsers,
			})) as ResourceWithUsersType[];
		},
	});
};

export const useGetPendingRequests = (userId: string) => {
	return useQuery({
		queryKey: ["pending", "requests", userId],
		queryFn: async () => {
			const response = await hono.api.resources.transaction.pending.$get({
				query: {
					userId,
				},
			});
			const res = await response.json();
			if (!res.success || !res.data) {
				Toast.toast.danger(
					(res as any).error || "Failed to get pending requests",
				);
				return [];
			}
			return res.data;
		},
		enabled: !!userId,
	});
};

export const useRespondToRequest = (userId: string) => {
	return useMutation({
		mutationKey: ["respond", "request", userId],
		mutationFn: async ({
			transactionId,
			accept,
		}: {
			transactionId: string;
			accept: boolean;
		}) => {
			const response = await hono.api.resources.transaction[
				":transactionId"
			].respond.$post({
				param: {
					transactionId,
				},
				json: {
					accept,
				},
			});
			const res = await response.json();
			if (!res.success || !res.data) {
				Toast.toast.danger(
					(res as any).error || "Failed to respond to request",
				);
				throw new Error("Failed to respond");
			}
			return res;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["pending", "requests", userId],
			});
			Toast.toast.success("Responded successfully");
		},
	});
};

export const useRequestBorrow = (userId: string) => {
	return useMutation({
		mutationKey: ["request", "borrow", userId],
		mutationFn: async (payload: { borrowerId: string; resourceId: string }) => {
			return new Promise((resolve, reject) => {
				const ws = hono.api.resources.transaction.ws.$ws(0);

				ws.addEventListener("open", () => {
					ws.send(JSON.stringify(payload));
				});

				ws.addEventListener("message", (event) => {
					try {
						const data = JSON.parse(event.data);
						if (data.success) {
							resolve(data);
						} else {
							reject(
								new Error(
									data.error || data.message || "Failed to request borrow",
								),
							);
						}
					} catch {
						reject(new Error("Failed to parse response"));
					} finally {
						ws.close();
					}
				});

				ws.addEventListener("error", () => {
					reject(new Error("WebSocket error occurred"));
				});
			});
		},
		onSuccess: (data: any) => {
			Toast.toast.success(data.message || "Borrow request sent!");
		},
		onError: (error: Error) => {
			Toast.toast.danger(error.message);
		},
	});
};
