import * as z from "zod";

export const conversationMemberSchema=z.object({
    id:z.uuid(),
    conversationId:z.uuid(),
    userId:z.string("userId").nonempty()
})

export type ConversationMemeberInfoType=z.infer<typeof conversationMemberSchema>;

export const isConversationMemberRequestValid=(conversationMemberInfo:unknown)=>{
    return conversationMemberSchema.safeParse(conversationMemberInfo);
}