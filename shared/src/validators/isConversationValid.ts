import { ConversationTypeEnum } from "@shared/types";
import * as z from"zod";

export const conversationSchema=z.object({
    id:z.uuid(),
    type:z.enum(ConversationTypeEnum),
    pulseId:z.uuid("pulseId"),
    createdAt:z.coerce.date(),
})

export type ConversationInfoType=z.infer<typeof conversationSchema>;

export const isConversationValid=(conversationInfo:unknown)=>{
    return conversationSchema.safeParse(conversationInfo);
}