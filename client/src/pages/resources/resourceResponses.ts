import type { ClientUserType } from "@client/utils/types";
import type {
	ResourceReviewType,
	ResourceType,
	TransactionType,
} from "@server/db/schema";

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

export type ResourceReviewSummary = {
	averageRating: number | null;
	count: number;
};

export type ResourceWithUsersType = {
	resource: ResourceType;
	author: ClientUserType | null;
	recentUsers: Array<Pick<ClientUserType, "id" | "name" | "image">>;
	reviewSummary: ResourceReviewSummary;
};

export type ResourceWithUsersApiItem = {
	resource: Omit<ResourceType, "createdAt"> & {
		createdAt: string | Date;
	};
	author: ClientUserType | null;
	recentUsers: Array<Pick<ClientUserType, "id" | "name" | "image">>;
	reviewSummary?: ResourceReviewSummary;
};

export type PendingRequestItem = {
	transaction: Omit<TransactionType, "startAt" | "endAt"> & {
		startAt: string;
		endAt: string | null;
	};
	resource: ResourceType | null;
	borrower: ClientUserType | null;
};

export type ResourceTransactionItem = Omit<
	TransactionType,
	"startAt" | "endAt"
> & {
	startAt: string | Date;
	endAt: string | Date | null;
};

export type ResourceReviewItem = Omit<ResourceReviewType, "createdAt"> & {
	createdAt: string | Date;
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
		reviewSummary: item.reviewSummary ?? {
			averageRating: null,
			count: 0,
		},
	}));
}

export function normalizeResourceTransaction(
	transaction: ResourceTransactionItem | null,
): TransactionType | null {
	if (!transaction) return null;

	return {
		...transaction,
		startAt: new Date(transaction.startAt),
		endAt: transaction.endAt ? new Date(transaction.endAt) : null,
	};
}
