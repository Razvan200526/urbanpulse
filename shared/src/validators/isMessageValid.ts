import * as z from "zod";

export const messageSchema=z.object({
    id:z.uuid(),
    conversationId:z.uuid("conversationId"),
    senderId:z.string("senderId").nonempty(),
    content:z.string("content").nonempty(),
    sentAt:z.coerce.date(),
})

export type MessageInfoType=z.infer<typeof messageSchema>;

export const isMessageRequestValid=(messageInfo:unknown)=>{
    return messageSchema.safeParse(messageInfo);
}