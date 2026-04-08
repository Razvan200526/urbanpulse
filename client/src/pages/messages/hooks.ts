import { hono, queryClient } from "@client/lib/api/client";
import type { MessageSocketMessageType } from "@shared/validators/messages/isConversationValid";
import { useMutation, useQuery } from "@tanstack/react-query";
import { backend } from "client/sdk/backend";
import { useEffect, useRef, useState } from "react";

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

export type MessageDeliveryStatus = "sent" | "delivered" | "read";

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
		deliveryStatus?: MessageDeliveryStatus;
	} | null;
};

export type ConversationThread = ConversationSummary & {
	messages: Array<{
		id: string;
		content: string;
		senderId: string;
		sentAt: string;
		sender: ConversationMemberView | null;
		deliveryStatus: MessageDeliveryStatus;
	}>;
};

type SendConversationMessageResult = {
	message: {
		id: string;
		content: string;
		senderId: string;
		sentAt: string;
	};
	thread: ConversationThread;
	recipients: string[];
};

type ReceiptUpdate = {
	messageId: string;
	senderId: string;
	deliveryStatus: MessageDeliveryStatus;
};

type ReceiptSocketData = {
	conversationId: string;
	receipts: ReceiptUpdate[];
	thread?: ConversationThread;
};

type ThreadSocketData = {
	conversationId?: string;
	thread: ConversationThread;
};

type TypingSocketData = {
	conversationId: string;
	userId: string;
	isTyping: boolean;
};

const MESSAGE_SOCKET_TIMEOUT_MS = 10000;

const toConversationSummary = (
	thread: ConversationThread,
): ConversationSummary => ({
	conversation: thread.conversation,
	members: thread.members,
	lastMessage: thread.messages.at(-1) ?? thread.lastMessage,
});

const syncConversationThread = (thread: ConversationThread) => {
	queryClient.setQueryData(
		["messages", "conversations", thread.conversation.id],
		thread,
	);
	queryClient.setQueryData<ConversationSummary[]>(
		["messages", "conversations"],
		(old) => {
			if (!old) {
				return old;
			}

			const summary = toConversationSummary(thread);
			if (
				old.some((entry) => entry.conversation.id === thread.conversation.id)
			) {
				return old.map((entry) =>
					entry.conversation.id === thread.conversation.id ? summary : entry,
				);
			}

			return [...old, summary];
		},
	);
};

const applyReceiptUpdates = (
	conversationId: string,
	receipts: ReceiptUpdate[],
) => {
	if (receipts.length === 0) {
		return;
	}

	const receiptByMessageId = new Map(
		receipts.map((receipt) => [receipt.messageId, receipt.deliveryStatus]),
	);

	queryClient.setQueryData<ConversationThread>(
		["messages", "conversations", conversationId],
		(old) => {
			if (!old) {
				return old;
			}

			return {
				...old,
				messages: old.messages.map((message) => {
					const deliveryStatus = receiptByMessageId.get(message.id);
					if (!deliveryStatus) {
						return message;
					}

					return {
						...message,
						deliveryStatus,
					};
				}),
			};
		},
	);
};

const sendMessageSocketRequest = <TData>(
	message: MessageSocketMessageType,
	fallbackMessage: string,
) => {
	return new Promise<TData>((resolve, reject) => {
		const id = crypto.randomUUID();
		let unsubscribe = () => {};
		let timeout: ReturnType<typeof setTimeout>;
		const cleanup = () => {
			clearTimeout(timeout);
			unsubscribe();
		};
		timeout = setTimeout(() => {
			cleanup();
			reject(new Error(fallbackMessage));
		}, MESSAGE_SOCKET_TIMEOUT_MS);

		unsubscribe = backend.messages.on<TData>("message", (response) => {
			if (response.id !== id) {
				return;
			}

			cleanup();
			if (!response.success) {
				reject(new Error(response.message || fallbackMessage));
				return;
			}

			resolve(response.data);
		});

		backend.messages.send({ ...message, id });
	});
};

export const sendConversationTypingState = (
	conversationId: string,
	isTyping: boolean,
) => {
	backend.messages.send({
		type: "typing",
		payload: { conversationId, isTyping },
	});
};

export const markConversationRead = (conversationId: string) => {
	backend.messages.send({
		type: "read_conversation",
		payload: { conversationId },
	});
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
			const result =
				await sendMessageSocketRequest<SendConversationMessageResult>(
					{
						type: "send_message",
						payload: {
							conversationId: payload.conversationId,
							content: payload.content,
						},
					},
					"Failed to send message",
				);
			return result.thread;
		},
		onSuccess: async (thread) => {
			syncConversationThread(thread);
		},
	});
};

export const useMessageSocketEvents = ({
	conversationId,
	currentUserId,
}: {
	conversationId: string | null;
	currentUserId: string | undefined;
}) => {
	const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
	const typingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

	useEffect(() => {
		const unsubscribe = backend.messages.on<unknown>("message", (response) => {
			if (!response.success) {
				return;
			}

			if (
				response.channelName === "messages:new" ||
				response.channelName === "messages:sent"
			) {
				const data = response.data as ThreadSocketData;
				if (data.thread) {
					syncConversationThread(data.thread);
					if (
						response.channelName === "messages:new" &&
						data.thread.conversation.id === conversationId
					) {
						markConversationRead(data.thread.conversation.id);
					}
				}
				return;
			}

			if (
				response.channelName === "messages:receipt" ||
				response.channelName === "messages:read"
			) {
				const data = response.data as ReceiptSocketData;
				if (data.thread) {
					syncConversationThread(data.thread);
				}
				applyReceiptUpdates(data.conversationId, data.receipts);
				return;
			}

			if (response.channelName === "messages:typing") {
				const data = response.data as TypingSocketData;
				if (
					data.conversationId !== conversationId ||
					data.userId === currentUserId
				) {
					return;
				}

				const existingTimer = typingTimers.current.get(data.userId);
				if (existingTimer) {
					clearTimeout(existingTimer);
				}

				if (!data.isTyping) {
					typingTimers.current.delete(data.userId);
					setTypingUserIds((old) =>
						old.filter((userId) => userId !== data.userId),
					);
					return;
				}

				setTypingUserIds((old) =>
					old.includes(data.userId) ? old : [...old, data.userId],
				);
				const timeout = setTimeout(() => {
					typingTimers.current.delete(data.userId);
					setTypingUserIds((old) =>
						old.filter((userId) => userId !== data.userId),
					);
				}, 3000);
				typingTimers.current.set(data.userId, timeout);
			}
		});

		return () => {
			unsubscribe();
			for (const timer of typingTimers.current.values()) {
				clearTimeout(timer);
			}
			typingTimers.current.clear();
		};
	}, [conversationId, currentUserId]);

	useEffect(() => {
		setTypingUserIds([]);
	}, []);

	useEffect(() => {
		if (!conversationId) {
			return;
		}

		markConversationRead(conversationId);
		return backend.messages.on("open", () => {
			markConversationRead(conversationId);
		});
	}, [conversationId]);

	return { typingUserIds };
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
