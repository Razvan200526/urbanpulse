import { ConversationTypeEnum } from "@shared/types";
import * as z from "zod";

export const createConversationSchema = z.object({
	type: z.nativeEnum(ConversationTypeEnum),
	memberIds: z.array(z.string().min(1)).min(1).max(10),
	pulseId: z.string().uuid().optional(),
});

export const conversationIdParamSchema = z.object({
	id: z.string().uuid(),
});

export const directConversationBodySchema = z.object({
	otherUserId: z.string().min(1),
});

export const sendMessageBodySchema = z.object({
	content: z.string().trim().min(1).max(2000),
});

export type CreateConversationType = z.infer<typeof createConversationSchema>;
export type DirectConversationBodyType = z.infer<
	typeof directConversationBodySchema
>;
export type SendMessageBodyType = z.infer<typeof sendMessageBodySchema>;
