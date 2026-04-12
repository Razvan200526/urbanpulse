import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@server/middleware/authMiddleware";
import auth from "@server/services/auth/AuthService";
import { messageSocketManager } from "@server/services/MessageSocketManager";
import { messagingService } from "@server/services/MessagingService";
import { handleError } from "@server/utils/handleError";
import {
	conversationIdParamSchema,
	directConversationBodySchema,
	messageSocketMessageSchema,
	sendMessageBodySchema,
} from "@shared/validators/messages/isConversationValid";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import type { WSContext } from "hono/ws";

const sendSocketError = (
	ws: WSContext,
	id: string | undefined,
	message: string,
) => {
	messageSocketManager.send(ws, {
		id,
		success: false,
		channelName: "messages:error",
		data: null,
		message,
	});
};

export const messageController = new Hono()
	.basePath("/messages")
	.use(authMiddleware)
	.get("/conversations", async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const conversations = await messagingService.listConversationsForUser(
			session.userId,
		);
		return c.json({
			success: true,
			message: "Conversations retrieved",
			data: conversations,
		});
	})
	.get(
		"/conversations/:id",
		zValidator("param", conversationIdParamSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}

			const thread = await messagingService.getConversationThread(
				session.userId,
				c.req.valid("param").id,
			);
			if (!thread) {
				return c.json(
					{ success: false, message: "Conversation not found", data: null },
					404,
				);
			}

			return c.json({
				success: true,
				message: "Conversation retrieved",
				data: thread,
			});
		},
	)
	.post(
		"/conversations/:id/resolve",
		zValidator("param", conversationIdParamSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}

			const resolved = await messagingService.resolveConversation({
				conversationId: c.req.valid("param").id,
				userId: session.userId,
			});
			if (!resolved) {
				return c.json(
					{ success: false, message: "Conversation not found", data: null },
					404,
				);
			}

			return c.json({
				success: true,
				message: "Conversation resolved",
				data: resolved,
			});
		},
	)
	.delete(
		"/conversations/:id",
		zValidator("param", conversationIdParamSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}

			const deleted = await messagingService.deleteConversation({
				conversationId: c.req.valid("param").id,
				userId: session.userId,
			});
			if (!deleted) {
				return c.json(
					{ success: false, message: "Conversation not found", data: null },
					404,
				);
			}

			return c.json({
				success: true,
				message: "Conversation deleted",
				data: deleted,
			});
		},
	)
	.post(
		"/direct",
		zValidator("json", directConversationBodySchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}

			const conversation = await messagingService.ensureDirectConversation(
				session.userId,
				c.req.valid("json").otherUserId,
			);
			if (!conversation) {
				return c.json(
					{
						success: false,
						message: "Failed to create direct conversation",
						data: null,
					},
					400,
				);
			}

			return c.json({
				success: true,
				message: "Direct conversation ready",
				data: conversation,
			});
		},
	)
	.get(
		"/ws",
		upgradeWebSocket(async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session) {
				return {
					onOpen: (_event, ws) => {
						sendSocketError(ws, undefined, "Unauthorized");
						ws.close();
					},
				};
			}

			return {
				onOpen: (_event, ws) => {
					messageSocketManager.register(ws, session.user.id);
				},
				onMessage: async (event, ws) => {
					let requestId: string | undefined;
					try {
						const raw = JSON.parse(event.data.toString());
						requestId = typeof raw.id === "string" ? raw.id : undefined;
						const parsed = messageSocketMessageSchema.safeParse(raw);
						if (!parsed.success) {
							sendSocketError(ws, requestId, "Invalid message request");
							return;
						}

						if (parsed.data.type === "send_message") {
							const result = await messagingService.sendMessage({
								conversationId: parsed.data.payload.conversationId,
								senderId: session.user.id,
								content: parsed.data.payload.content,
							});
							if (!result) {
								sendSocketError(ws, requestId, "Failed to send message");
								return;
							}

							const sentPayload = {
								success: true,
								channelName: "messages:sent" as const,
								data: result,
								message: "Message sent",
							};
							messageSocketManager.send(ws, {
								id: requestId,
								...sentPayload,
							});
							messageSocketManager.sendToUsers([session.user.id], sentPayload, {
								except: ws,
							});

							for (const recipientId of result.recipients) {
								const thread = await messagingService.getConversationThread(
									recipientId,
									parsed.data.payload.conversationId,
								);
								if (!thread) {
									continue;
								}

								messageSocketManager.sendToUsers([recipientId], {
									success: true,
									channelName: "messages:new",
									data: {
										conversationId: thread.conversation.id,
										thread,
									},
									message: "New message",
								});
							}
							return;
						}

						if (parsed.data.type === "typing") {
							const recipients =
								await messagingService.listOtherConversationMemberIds(
									parsed.data.payload.conversationId,
									session.user.id,
								);
							if (!recipients) {
								sendSocketError(ws, requestId, "Conversation not found");
								return;
							}

							messageSocketManager.sendToUsers(recipients, {
								success: true,
								channelName: "messages:typing",
								data: {
									conversationId: parsed.data.payload.conversationId,
									userId: session.user.id,
									isTyping: parsed.data.payload.isTyping,
								},
								message: null,
							});
							return;
						}

						if (parsed.data.type === "read_conversation") {
							const receiptUpdates =
								await messagingService.markConversationRead({
									conversationId: parsed.data.payload.conversationId,
									userId: session.user.id,
								});
							if (!receiptUpdates) {
								sendSocketError(ws, requestId, "Conversation not found");
								return;
							}

							const thread = await messagingService.getConversationThread(
								session.user.id,
								parsed.data.payload.conversationId,
							);
							if (!thread) {
								sendSocketError(ws, requestId, "Conversation not found");
								return;
							}

							messageSocketManager.send(ws, {
								id: requestId,
								success: true,
								channelName: "messages:read",
								data: {
									conversationId: parsed.data.payload.conversationId,
									receipts: receiptUpdates,
									thread,
								},
								message: "Conversation read",
							});

							if (receiptUpdates.length > 0) {
								messageSocketManager.sendToUsers(
									thread.members.map((member) => member.id),
									{
										success: true,
										channelName: "messages:receipt",
										data: {
											conversationId: parsed.data.payload.conversationId,
											receipts: receiptUpdates,
										},
										message: "Message receipts updated",
									},
								);
							}
						}
					} catch (error) {
						if (error instanceof SyntaxError) {
							sendSocketError(ws, requestId, "Invalid JSON payload");
							return;
						}
						handleError(error);
						sendSocketError(ws, requestId, "Failed to process message event");
					}
				},
				onClose: (_event, ws) => {
					messageSocketManager.unregister(ws);
				},
			};
		}),
	)
	.post(
		"/conversations/:id/messages",
		zValidator("param", conversationIdParamSchema),
		zValidator("json", sendMessageBodySchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}

			const result = await messagingService.sendMessage({
				conversationId: c.req.valid("param").id,
				senderId: session.userId,
				content: c.req.valid("json").content,
			});
			if (!result) {
				return c.json(
					{ success: false, message: "Failed to send message", data: null },
					400,
				);
			}

			return c.json({
				success: true,
				message: "Message sent",
				data: result,
			});
		},
	);
