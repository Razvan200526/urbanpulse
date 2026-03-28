import * as z from "zod";

export const petAlertSchema=z.object({
   id:z.uuid(),
       pulseId:z.uuid("pulseId"),
       petType:z.string("petType").nonempty(),
       color:z.string("color").nonempty(),
       breed:z.string("breed"),
       imageURL:z.string("imageURL"),
       aiDescriptor:z.string("aiDescriptor"),
})

export type PetAlertType=z.infer<typeof petAlertSchema>;

export const isPetAlertValid=(petAlertInfo:unknown)=>{
    return petAlertSchema.safeParse(petAlertInfo);
}