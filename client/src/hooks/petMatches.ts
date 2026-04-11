import { hono, queryClient } from "@client/lib/api/client";
import { parseApiData } from "@client/lib/api/parse";
import {
	petMatchActionResponseSchema,
	petMatchWorkflowItemSchema,
	petMatchWorkflowListSchema,
} from "@client/utils/petMatches";
import { useMutation, useQuery } from "@tanstack/react-query";

const invalidatePetMatchQueries = async (petMatchId: string) => {
	await queryClient.invalidateQueries({ queryKey: ["pet-matches"] });
	await queryClient.invalidateQueries({ queryKey: ["notifications"] });
	await queryClient.invalidateQueries({
		queryKey: ["pet-matches", "detail", petMatchId],
	});
};

export const usePetMatchesForAlert = (petAlertId: string | null) => {
	return useQuery({
		queryKey: ["pet-matches", "alerts", petAlertId],
		enabled: Boolean(petAlertId),
		queryFn: async () => {
			if (!petAlertId) {
				return [];
			}

			const response = await hono.api["pet-matches"].alerts[":petAlertId"].$get(
				{
					param: { petAlertId },
				},
			);
			const parsed = await parseApiData(
				response,
				petMatchWorkflowListSchema,
				"Failed to load pet matches",
			);

			return parsed.data;
		},
	});
};

export const usePetMatchDetail = (petMatchId: string | null) => {
	return useQuery({
		queryKey: ["pet-matches", "detail", petMatchId],
		enabled: Boolean(petMatchId),
		queryFn: async () => {
			if (!petMatchId) {
				return null;
			}

			const response = await hono.api["pet-matches"][":petMatchId"].$get({
				param: { petMatchId },
			});
			const parsed = await parseApiData(
				response,
				petMatchWorkflowItemSchema,
				"Failed to load pet match",
			);

			return parsed.data;
		},
	});
};

export const useMarkPetMatchOwnerInterested = () => {
	return useMutation({
		mutationKey: ["pet-matches", "owner-interest"],
		mutationFn: async (petMatchId: string) => {
			const response = await hono.api["pet-matches"][":petMatchId"][
				"owner-interest"
			].$post({
				param: { petMatchId },
			});
			const parsed = await parseApiData(
				response,
				petMatchActionResponseSchema,
				"Failed to update pet match",
			);

			return parsed.data;
		},
		onSuccess: async (result) => {
			await invalidatePetMatchQueries(result.item.petMatch.id);
		},
	});
};

export const useDismissPetMatchAsOwner = () => {
	return useMutation({
		mutationKey: ["pet-matches", "owner-dismiss"],
		mutationFn: async (petMatchId: string) => {
			const response = await hono.api["pet-matches"][":petMatchId"][
				"owner-dismiss"
			].$post({
				param: { petMatchId },
			});
			const parsed = await parseApiData(
				response,
				petMatchActionResponseSchema,
				"Failed to dismiss pet match",
			);

			return parsed.data;
		},
		onSuccess: async (result) => {
			await invalidatePetMatchQueries(result.item.petMatch.id);
		},
	});
};

export const useAcceptPetMatchAsFinder = () => {
	return useMutation({
		mutationKey: ["pet-matches", "finder-accept"],
		mutationFn: async (petMatchId: string) => {
			const response = await hono.api["pet-matches"][":petMatchId"][
				"finder-accept"
			].$post({
				param: { petMatchId },
			});
			const parsed = await parseApiData(
				response,
				petMatchActionResponseSchema,
				"Failed to open pet-match chat",
			);

			return parsed.data;
		},
		onSuccess: async (result) => {
			await invalidatePetMatchQueries(result.item.petMatch.id);
			await queryClient.invalidateQueries({
				queryKey: ["messages", "conversations"],
			});
		},
	});
};

export const useDeclinePetMatchAsFinder = () => {
	return useMutation({
		mutationKey: ["pet-matches", "finder-decline"],
		mutationFn: async (petMatchId: string) => {
			const response = await hono.api["pet-matches"][":petMatchId"][
				"finder-decline"
			].$post({
				param: { petMatchId },
			});
			const parsed = await parseApiData(
				response,
				petMatchActionResponseSchema,
				"Failed to decline pet match",
			);

			return parsed.data;
		},
		onSuccess: async (result) => {
			await invalidatePetMatchQueries(result.item.petMatch.id);
		},
	});
};
