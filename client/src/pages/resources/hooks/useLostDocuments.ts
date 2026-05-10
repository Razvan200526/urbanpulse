import { hono, queryClient } from "@client/lib/api/client";
import { Toast } from "@heroui/react";
import type { LostDocumentTypeEnum } from "@shared/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	getApiErrorMessage,
	type MutationResponse,
} from "../resourceResponses";

type LostDocumentPreviewApi = {
	id: string;
	documentType: LostDocumentTypeEnum;
	extractedCity: string | null;
	blurredImageUrl: string;
	createdAt: string | Date;
};

type LostDocumentMatchApi = {
	matchId: string;
	documentId: string;
	matchScore: number;
	potentialOwner: {
		id: string;
		name: string;
		email: string;
	};
	nameMatch: boolean;
	birthYearMatch: boolean;
	cityMatch: boolean;
};

export type LostDocumentPreview = Omit<LostDocumentPreviewApi, "createdAt"> & {
	createdAt: Date;
};

export const lostDocumentQueryKeys = {
	mine: ["lost-documents", "mine"] as const,
	publicFeed: ["lost-documents", "public"] as const,
	matches: ["lost-documents", "matches"] as const,
};

const normalizeDocuments = (
	documents: LostDocumentPreviewApi[],
): LostDocumentPreview[] => {
	return documents.map((document) => ({
		...document,
		createdAt: new Date(document.createdAt),
	}));
};

export const useUploadLostDocument = () => {
	return useMutation({
		mutationKey: ["lost-documents", "upload"],
		mutationFn: async (file: File) => {
			const response = await hono.api["lost-documents"].$post({
				form: {
					document: file,
				},
			});

			const result = (await response.json()) as MutationResponse<{
				documentId: string;
			}>;
			if (!result.success || !result.data) {
				throw new Error(
					result.success
						? "Upload failed"
						: getApiErrorMessage(result, "Upload failed"),
				);
			}
			return result.data;
		},
		onSuccess: () => {
			Toast.toast.success("Document uploaded and queued for matching");
			queryClient.invalidateQueries({ queryKey: lostDocumentQueryKeys.mine });
			queryClient.invalidateQueries({
				queryKey: lostDocumentQueryKeys.publicFeed,
			});
			queryClient.invalidateQueries({
				queryKey: lostDocumentQueryKeys.matches,
			});
		},
		onError: (error) => {
			Toast.toast.danger(
				error instanceof Error ? error.message : "Failed to upload document",
			);
		},
	});
};

export const useMyLostDocuments = () => {
	return useQuery({
		queryKey: lostDocumentQueryKeys.mine,
		queryFn: async () => {
			const response = await hono.api["lost-documents"].$get();
			const result = (await response.json()) as MutationResponse<
				LostDocumentPreviewApi[]
			>;
			if (!result.success || !result.data) {
				Toast.toast.danger(
					result.success
						? "Failed to retrieve your documents"
						: getApiErrorMessage(result, "Failed to retrieve your documents"),
				);
				return [];
			}
			return normalizeDocuments(result.data);
		},
	});
};

export const usePublicLostDocuments = () => {
	return useQuery({
		queryKey: lostDocumentQueryKeys.publicFeed,
		queryFn: async () => {
			const response = await hono.api["lost-documents"].public.$get();
			const result = (await response.json()) as MutationResponse<
				LostDocumentPreviewApi[]
			>;
			if (!result.success || !result.data) {
				Toast.toast.danger(
					result.success
						? "Failed to retrieve community uploads"
						: getApiErrorMessage(
								result,
								"Failed to retrieve community uploads",
							),
				);
				return [];
			}
			return normalizeDocuments(result.data);
		},
	});
};

export const useLostDocumentMatches = () => {
	return useQuery({
		queryKey: lostDocumentQueryKeys.matches,
		queryFn: async () => {
			const response = await hono.api["lost-documents"].matches.$get();
			const result = (await response.json()) as MutationResponse<
				LostDocumentMatchApi[]
			>;
			if (!result.success || !result.data) {
				Toast.toast.danger(
					result.success
						? "Failed to retrieve document matches"
						: getApiErrorMessage(result, "Failed to retrieve document matches"),
				);
				return [];
			}
			return result.data;
		},
	});
};
