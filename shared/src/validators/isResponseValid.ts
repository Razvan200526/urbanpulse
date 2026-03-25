import { ResponseStatusEnum } from "@shared/types";
import * as z from "zod";

export const responseSchema=z.object({
 pulseId:z.string().uuid(),// check if it should be pulseId.uuid() or not
 responderID:z.string().uuid(),
 status:z.enum(["PENDING","ACCEPTED","DECLINED","COMPLETED"]),
 createdAt:z.coerce.date().optional(),
})

export type ResponseInfoType=z.infer<typeof responseSchema>;

export const isResponseRequestValid=(requestInfo:unknown)=>{
    return responseSchema.safeParse(responseSchema);
}