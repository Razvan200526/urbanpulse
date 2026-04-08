import { hono, queryClient } from "@client/lib/api/client";
import type { ClientUserType } from "@client/utils/types";
import { Toast } from "@heroui/react";
import type { FilterResourceType } from "@shared/types";
import type { ResourceType as CreateResourceInput } from "@shared/validators/resources/isResourceValid";
import { useMutation, useQuery } from "@tanstack/react-query";
import posthog from "posthog-js";
import {
	getApiErrorMessage,
	type MutationResponse,
	normalizeResources,
	type PendingRequestItem,
	type ResourceWithUsersApiItem,
} from "./resourceResponses";

export type { ResourceWithUsersType } from "./resourceResponses";

export const useUploadResource = (userId: string) => {
	return useMutation({
		mutationKey: ["upload", "resource", userId],
		mutationFn: async (resource: CreateResourceInput) => {
			const response = await hono.api.resources.$post({ json: resource });
			const res = (await response.json()) as MutationResponse<unknown>;
			if (!res.success || !res.data) {
				Toast.toast.danger(
					res.success
						? "Failed to upload resource"
						: getApiErrorMessage(res, "Failed to upload resource"),
				);
				return;
			}
			return res;
		},
		onSuccess: (_, resource) => {
			queryClient.invalidateQueries({
				queryKey: ["resources"],
			});
			posthog.capture("resource_uploaded", {
				availability: resource.availability,
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
			const res = (await response.json()) as MutationResponse<ClientUserType>;
			if (!res.success || !res.data) {
				Toast.toast.danger(
					res.success
						? "Failed to get author"
						: getApiErrorMessage(res, "Failed to get author"),
				);
				return;
			}
			return res.data as ClientUserType;
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
			const res = (await response.json()) as MutationResponse<
				PendingRequestItem[]
			>;
			if (!res.success) {
				Toast.toast.danger(
					getApiErrorMessage(res, "Failed to get pending requests"),
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
			const res = (await response.json()) as MutationResponse<unknown>;
			if (!res.success) {
				Toast.toast.danger(
					getApiErrorMessage(res, "Failed to respond to request"),
				);
				throw new Error("Failed to respond");
			}
			return res;
		},
		onSuccess: (_, { accept }) => {
			queryClient.invalidateQueries({
				queryKey: ["pending", "requests", userId],
			});
			Toast.toast.success("Responded successfully");
			posthog.capture("borrow_request_responded", { accepted: accept });
		},
	});
};

export const useRequestBorrow = (userId: string) => {
	return useMutation({
		mutationKey: ["request", "borrow", userId],
		mutationFn: async (payload: { borrowerId: string; resourceId: string }) => {
			return new Promise<{ message?: string }>((resolve, reject) => {
				const ws = hono.api.resources.transaction.ws.$ws(0);

				ws.addEventListener("open", () => {
					ws.send(JSON.stringify(payload));
				});

				ws.addEventListener("message", (event) => {
					try {
						const data = JSON.parse(event.data) as {
							success?: boolean;
							message?: string;
							error?: string;
						};
						if (data.success) {
							resolve({ message: data.message });
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
		onSuccess: (data: { message?: string }, { resourceId }) => {
			Toast.toast.success(data.message || "Borrow request sent!");
			posthog.capture("borrow_requested", { resource_id: resourceId });
		},
		onError: (error: Error) => {
			Toast.toast.danger(error.message);
		},
	});
};

export const useFilterResources = (filter: FilterResourceType) => {
	return useQuery({
		queryKey: ["resources", filter],
		queryFn: async () => {
			const response = await hono.api.resources.$get({ query: { filter } });
			const res = (await response.json()) as MutationResponse<
				ResourceWithUsersApiItem[]
			>;
			if (!res.success || !res.data) {
				Toast.toast.danger(
					res.success
						? "Failed to retrieve resources"
						: getApiErrorMessage(res, "Failed to retrieve resources"),
				);
				return [];
			}
			return normalizeResources(res.data);
		},
	});
};

export const useMyResources = (filter: FilterResourceType) => {
	return useQuery({
		queryKey: ["resources", "mine", filter],
		queryFn: async () => {
			const response = await hono.api.resources.mine.$get({
				query: { filter },
			});
			const res = (await response.json()) as MutationResponse<
				ResourceWithUsersApiItem[]
			>;
			if (!res.success || !res.data) {
				Toast.toast.danger(
					res.success
						? "Failed to retrieve your resources"
						: getApiErrorMessage(res, "Failed to retrieve your resources"),
				);
				return [];
			}
			return normalizeResources(res.data);
		},
	});
};
