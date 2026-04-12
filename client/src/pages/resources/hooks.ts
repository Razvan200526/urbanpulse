import { hono, queryClient } from "@client/lib/api/client";
import type { ClientUserType } from "@client/utils/types";
import { Toast } from "@heroui/react";
import type { FilterResourceType } from "@shared/types";
import type { GetResourceQuery } from "@shared/validators/resources/isGetResourcesQueryValid";
import type {
	CreateResourcePayload,
	UpdateResourcePayload,
} from "@shared/validators/resources/isResourceValid";
import type { ResourceReviewPayload } from "@shared/validators/transactions/isTransactionRequestValid";
import { useMutation, useQuery } from "@tanstack/react-query";
import posthog from "posthog-js";
import {
	getApiErrorMessage,
	type MutationResponse,
	normalizeResources,
	normalizeResourceTransaction,
	type PendingRequestItem,
	type ResourceReviewItem,
	type ResourceTransactionItem,
	type ResourceWithUsersApiItem,
} from "./resourceResponses";

export type { ResourceWithUsersType } from "./resourceResponses";

type ResourceFilterCriteria = {
	filter: FilterResourceType;
	excludeOwn?: boolean;
	lat?: number;
	long?: number;
	radiusMeters?: number;
	type?: GetResourceQuery["type"];
};

type ResourceQueryParams = {
	filter: FilterResourceType;
	excludeOwn?: string;
	lat?: string;
	long?: string;
	radiusMeters?: string;
	type?: GetResourceQuery["type"];
};

type UpdateResourceVariables = UpdateResourcePayload & {
	resourceId: string;
};

const normalizeResourceFilterCriteria = (
	criteria: FilterResourceType | ResourceFilterCriteria,
): ResourceFilterCriteria =>
	typeof criteria === "string" ? { filter: criteria } : criteria;

const toResourceQueryParams = (
	criteria: ResourceFilterCriteria,
): ResourceQueryParams => {
	const query: ResourceQueryParams = { filter: criteria.filter };

	if (criteria.excludeOwn !== undefined) {
		query.excludeOwn = String(criteria.excludeOwn);
	}

	if (criteria.lat !== undefined) {
		query.lat = String(criteria.lat);
	}

	if (criteria.long !== undefined) {
		query.long = String(criteria.long);
	}

	if (criteria.radiusMeters !== undefined) {
		query.radiusMeters = String(criteria.radiusMeters);
	}

	if (criteria.type !== undefined) {
		query.type = criteria.type;
	}

	return query;
};

export const useDeleteResource = () => {
	return useMutation({
		mutationKey: ["delete", "resource"],
		mutationFn: async (resourceId: string) => {
			const response = await hono.api.resources[":resourceId"].$delete({
				param: { resourceId },
			});
			const res = (await response.json()) as MutationResponse<unknown>;
			if (!res.success) {
				Toast.toast.danger(
					res.success
						? "Failed to delete resource"
						: getApiErrorMessage(res, "Failed to delete resource"),
				);
				return;
			}
			return res;
		},
		onSuccess: (response, resourceId) => {
			if (!response?.success) {
				return;
			}

			queryClient.setQueriesData({ queryKey: ["resources"] }, (old) => {
				if (!Array.isArray(old)) {
					return old;
				}

				return old.filter((item) => item?.resource?.id !== resourceId);
			});
			queryClient.invalidateQueries({ queryKey: ["resources"] });
			queryClient.invalidateQueries({
				queryKey: ["retrieve", "resources", resourceId],
			});
		},
	});
};

export const useUploadResource = (userId: string) => {
	return useMutation({
		mutationKey: ["upload", "resource", userId],
		mutationFn: async (resource: CreateResourcePayload) => {
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

export const useUpdateResource = () => {
	return useMutation({
		mutationKey: ["update", "resource"],
		mutationFn: async ({
			resourceId,
			...resource
		}: UpdateResourceVariables) => {
			const response = await hono.api.resources[":resourceId"].$patch({
				param: { resourceId },
				json: resource,
			});
			const res = (await response.json()) as MutationResponse<unknown>;
			if (!res.success || !res.data) {
				const message = res.success
					? "Failed to update resource"
					: getApiErrorMessage(res, "Failed to update resource");
				Toast.toast.danger(message);
				throw new Error(message);
			}
			return res;
		},
		onSuccess: (_, resource) => {
			queryClient.invalidateQueries({ queryKey: ["resources"] });
			queryClient.invalidateQueries({
				queryKey: ["retrieve", "resources", resource.resourceId],
			});
			Toast.toast.success("Resource updated");
			posthog.capture("resource_updated", {
				resource_id: resource.resourceId,
				availability: resource.availability,
				resource_type: resource.resourceType,
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
			queryClient.invalidateQueries({ queryKey: ["resources"] });
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
			queryClient.invalidateQueries({
				queryKey: ["resources", "transaction", "mine", resourceId, userId],
			});
			posthog.capture("borrow_requested", { resource_id: resourceId });
		},
		onError: (error: Error) => {
			Toast.toast.danger(error.message);
		},
	});
};

export const useGetResourceTransaction = (
	resourceId: string,
	userId: string,
) => {
	return useQuery({
		queryKey: ["resources", "transaction", "mine", resourceId, userId],
		queryFn: async () => {
			const response = await hono.api.resources[
				":resourceId"
			].transaction.mine.$get({
				param: { resourceId },
			});
			const res =
				(await response.json()) as MutationResponse<ResourceTransactionItem | null>;
			if (!res.success) {
				Toast.toast.danger(
					getApiErrorMessage(res, "Failed to get resource transaction"),
				);
				return null;
			}
			return normalizeResourceTransaction(res.data);
		},
		enabled: !!resourceId && !!userId,
	});
};

export const useCompleteResourceTransaction = (userId: string) => {
	return useMutation({
		mutationKey: ["resources", "transaction", "complete", userId],
		mutationFn: async ({
			transactionId,
		}: {
			transactionId: string;
			resourceId: string;
		}) => {
			const response = await hono.api.resources.transaction[
				":transactionId"
			].complete.$post({
				param: { transactionId },
			});
			const res =
				(await response.json()) as MutationResponse<ResourceTransactionItem>;
			if (!res.success || !res.data) {
				Toast.toast.danger(
					res.success
						? "Failed to complete transaction"
						: getApiErrorMessage(res, "Failed to complete transaction"),
				);
				throw new Error("Failed to complete transaction");
			}
			return normalizeResourceTransaction(res.data);
		},
		onSuccess: (_, { resourceId }) => {
			queryClient.invalidateQueries({ queryKey: ["resources"] });
			queryClient.invalidateQueries({
				queryKey: ["resources", "transaction", "mine", resourceId, userId],
			});
			Toast.toast.success("Transaction marked as done");
			posthog.capture("resource_transaction_completed", {
				resource_id: resourceId,
			});
		},
	});
};

export const useSubmitResourceReview = (userId: string) => {
	return useMutation({
		mutationKey: ["resources", "review", userId],
		mutationFn: async ({
			transactionId,
			rating,
			comment,
		}: ResourceReviewPayload & {
			transactionId: string;
			resourceId: string;
		}) => {
			const response = await hono.api.resources.transaction[
				":transactionId"
			].review.$post({
				param: { transactionId },
				json: { rating, comment },
			});
			const res =
				(await response.json()) as MutationResponse<ResourceReviewItem>;
			if (!res.success || !res.data) {
				Toast.toast.danger(
					res.success
						? "Failed to submit review"
						: getApiErrorMessage(res, "Failed to submit review"),
				);
				throw new Error("Failed to submit review");
			}
			return res.data;
		},
		onSuccess: (_, { resourceId, rating }) => {
			queryClient.invalidateQueries({ queryKey: ["resources"] });
			queryClient.invalidateQueries({
				queryKey: ["resources", "transaction", "mine", resourceId, userId],
			});
			Toast.toast.success("Review submitted");
			posthog.capture("resource_review_submitted", {
				resource_id: resourceId,
				rating,
			});
		},
	});
};

export const useFilterResources = (
	criteria: FilterResourceType | ResourceFilterCriteria,
) => {
	const normalizedCriteria = normalizeResourceFilterCriteria(criteria);

	return useQuery({
		queryKey: ["resources", normalizedCriteria],
		queryFn: async () => {
			const response = await hono.api.resources.$get({
				query: toResourceQueryParams(normalizedCriteria),
			});
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
