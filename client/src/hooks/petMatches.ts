import { hono, queryClient } from "@client/lib/api/client";
import { Toast } from "@heroui/react";
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

			const res = await response.json();
			if (!res.success) {
				Toast.toast.danger(res.message || "Failed to load pet matches");
				return [];
			}

			return res.data;
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

			const res = await response.json();
			if (!res.success) {
				Toast.toast.danger(res.message || "Failed to load pet match");
				return null;
			}

			return res.data;
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

			const res = await response.json();
			if (!res.success) {
				Toast.toast.danger(res.message || "Failed to update pet match");
				return null;
			}

			return res.data;
		},
		onSuccess: async (result) => {
			if (result) {
				await invalidatePetMatchQueries(result.item.petMatch.id);
			}
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

			const res = await response.json();
			if (!res.success) {
				Toast.toast.danger(res.message || "Failed to dismiss pet match");
				return null;
			}

			return res.data;
		},
		onSuccess: async (result) => {
			if (result) {
				await invalidatePetMatchQueries(result.item.petMatch.id);
			}
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

			const res = await response.json();
			if (!res.success) {
				Toast.toast.danger(res.message || "Failed to open pet-match chat");
				return null;
			}

			return res.data;
		},
		onSuccess: async (result) => {
			if (result) {
				await invalidatePetMatchQueries(result.item.petMatch.id);
				await queryClient.invalidateQueries({
					queryKey: ["messages", "conversations"],
				});
			}
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

			const res = await response.json();
			if (!res.success) {
				Toast.toast.danger(res.message || "Failed to decline pet match");
				return null;
			}

			return res.data;
		},
		onSuccess: async (result) => {
			if (result) {
				await invalidatePetMatchQueries(result.item.petMatch.id);
			}
		},
	});
};
