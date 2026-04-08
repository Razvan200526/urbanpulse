import { createSafePlainTextSchema } from "@shared/validators/createSafePlainTextSchema";
import * as z from "zod";

export const conversationIdParamSchema = z.object({
	id: z.string().uuid(),
});

export const sendConversationMessageSchema = z.object({
	content: createSafePlainTextSchema(1, 500),
});

export type SendConversationMessageType = z.infer<
	typeof sendConversationMessageSchema
>;
