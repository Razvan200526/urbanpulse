import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@server/middleware/authMiddleware";
import { messagingService } from "@server/services/MessagingService";
import {
	conversationIdParamSchema,
	directConversationBodySchema,
	sendMessageBodySchema,
} from "@shared/validators/messages/isConversationValid";
import { Hono } from "hono";

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
