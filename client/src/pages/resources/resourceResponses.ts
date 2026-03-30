import type { ClientUserType } from "@client/utils/types";
import type { ResourceType, TransactionType } from "@server/db/schema";

export type ApiSuccessResponse<T> = {
	success: true;
	message?: string;
	data: T;
};

export type ApiErrorResponse = {
	success: false;
	error?: string;
	message?: string;
	data?: null;
};

export type MutationResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type ResourceWithUsersType = {
	resource: ResourceType;
	author: ClientUserType | null;
	recentUsers: Array<Pick<ClientUserType, "id" | "name" | "image">>;
};

export type ResourceWithUsersApiItem = {
	resource: Omit<ResourceType, "createdAt"> & {
		createdAt: string | Date;
	};
	author: ClientUserType | null;
	recentUsers: Array<Pick<ClientUserType, "id" | "name" | "image">>;
};

export type PendingRequestItem = {
	transaction: Omit<TransactionType, "startAt" | "endAt"> & {
		startAt: string;
		endAt: string | null;
	};
	resource: ResourceType | null;
	borrower: ClientUserType | null;
};

export function getApiErrorMessage(
	response: ApiErrorResponse,
	fallback: string,
) {
	return response.error || response.message || fallback;
}

export function normalizeResources(
	items: ResourceWithUsersApiItem[],
): ResourceWithUsersType[] {
	return items.map((item) => ({
		resource: {
			...item.resource,
			createdAt: new Date(item.resource.createdAt),
		},
		author: item.author,
		recentUsers: item.recentUsers,
	}));
}
