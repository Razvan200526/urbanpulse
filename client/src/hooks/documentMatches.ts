import { hono, queryClient } from "@client/lib/api/client";
import { Toast } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";

export const useOpenDocumentMatchChat = () => {
	return useMutation({
		mutationKey: ["document-matches", "open-chat"],
		mutationFn: async (matchId: string) => {
			const response = await hono.api["lost-documents"].matches[":matchId"][
				"open-chat"
			].$post({
				param: { matchId },
			});

			const result = await response.json();
			if (!result.success || !result.data?.conversationId) {
				Toast.toast.danger(
					"error" in result ? result.error : "Failed to open chat",
				);
				return null;
			}

			return result.data as {
				conversationId: string;
				counterpartUserId: string;
			};
		},
		onSuccess: async (result) => {
			if (result?.conversationId) {
				await queryClient.invalidateQueries({
					queryKey: ["messages", "conversations"],
				});
			}
		},
	});
};
