import { hono, queryClient } from "@client/main";
import { useMutation, useQuery } from "@tanstack/react-query";

type SuccessResponse<T> = {
	success: boolean;
	message: string;
	data: T;
};

export type ConversationMemberView = {
	id: string;
	name: string;
	email: string;
	image: string | null;
};

export type ConversationSummary = {
	conversation: {
		id: string;
		type: string;
		pulseId: string | null;
		createdAt: string;
	};
	members: ConversationMemberView[];
	lastMessage: {
		id: string;
		content: string;
		senderId: string;
		sentAt: string;
	} | null;
};

export type ConversationThread = ConversationSummary & {
	messages: Array<{
		id: string;
		content: string;
		senderId: string;
		sentAt: string;
		sender: ConversationMemberView | null;
	}>;
};

export const useConversationList = () => {
	return useQuery({
		queryKey: ["messages", "conversations"],
		queryFn: async () => {
			const res = await hono.api.messages.conversations.$get();
			const json = (await res.json()) as SuccessResponse<ConversationSummary[]>;
			if (!json.success) {
				throw new Error(json.message || "Failed to load conversations");
			}
			return json.data;
		},
	});
};

export const useConversationThread = (conversationId: string | null) => {
	return useQuery({
		queryKey: ["messages", "conversations", conversationId],
		enabled: Boolean(conversationId),
		queryFn: async () => {
			if (!conversationId) {
				return null;
			}

			const res = await hono.api.messages.conversations[":id"].$get({
				param: { id: conversationId },
			});
			const json =
				(await res.json()) as SuccessResponse<ConversationThread | null>;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to load conversation");
			}
			return json.data;
		},
	});
};

export const useSendConversationMessage = () => {
	return useMutation({
		mutationKey: ["messages", "send"],
		mutationFn: async (payload: {
			conversationId: string;
			content: string;
		}) => {
			const res = await hono.api.messages.conversations[":id"].messages.$post({
				param: { id: payload.conversationId },
				json: { content: payload.content },
			});
			const json = (await res.json()) as SuccessResponse<{
				thread: ConversationThread;
			} | null>;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to send message");
			}
			return json.data.thread;
		},
		onSuccess: async (thread) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["messages", "conversations"],
				}),
				queryClient.setQueryData(
					["messages", "conversations", thread.conversation.id],
					thread,
				),
			]);
		},
	});
};

export const useEnsureDirectConversation = () => {
	return useMutation({
		mutationKey: ["messages", "direct"],
		mutationFn: async (otherUserId: string) => {
			const res = await hono.api.messages.direct.$post({
				json: { otherUserId },
			});
			const json = (await res.json()) as SuccessResponse<{
				id: string;
			} | null>;
			if (!json.success || !json.data) {
				throw new Error(json.message || "Failed to open direct conversation");
			}
			return json.data;
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["messages", "conversations"],
			});
		},
	});
};
