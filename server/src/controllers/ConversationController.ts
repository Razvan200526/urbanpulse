import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@server/middleware/authMiddleware";
import { conversationService } from "@server/services/ConversationService";
import {
	conversationIdParamSchema,
	sendConversationMessageSchema,
} from "@shared/validators/messages/isConversationMessageValid";
import { createConversationSchema } from "@shared/validators/messages/isConversationValid";
import { Hono } from "hono";

export const conversationController = new Hono()
	.basePath("/conversations")
	.use(authMiddleware)
	.get("/", async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const conversations = await conversationService.listConversationsForUser(
			session.userId,
		);

		return c.json({
			success: true,
			message: "Conversations retrieved",
			data: conversations,
		});
	})
	.post("/", zValidator("json", createConversationSchema), async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const created = await conversationService.createConversation(
			session.userId,
			c.req.valid("json"),
		);

		if (!created) {
			return c.json(
				{
					success: false,
					message: "Failed to create conversation",
					data: null,
				},
				400,
			);
		}

		return c.json({
			success: true,
			message: "Conversation created",
			data: created,
		});
	})
	.get(
		"/:id/messages",
		zValidator("param", conversationIdParamSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}

			const { id } = c.req.valid("param");
			const messages = await conversationService.listMessages(
				id,
				session.userId,
			);
			if (!messages) {
				return c.json(
					{ success: false, message: "Forbidden", data: null },
					403,
				);
			}

			return c.json({
				success: true,
				message: "Messages retrieved",
				data: messages,
			});
		},
	)
	.post(
		"/:id/messages",
		zValidator("param", conversationIdParamSchema),
		zValidator("json", sendConversationMessageSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}

			const { id } = c.req.valid("param");
			const created = await conversationService.sendMessage(
				id,
				session.userId,
				c.req.valid("json"),
			);
			if (!created) {
				return c.json(
					{ success: false, message: "Forbidden", data: null },
					403,
				);
			}

			return c.json({
				success: true,
				message: "Message sent",
				data: created,
			});
		},
	);
