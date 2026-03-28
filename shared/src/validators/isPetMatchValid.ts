import * as z from "zod";

export const petMatchSchema = z.object({
    id: z.uuid().optional(),
    lostAlertId: z.uuid(),
    foundAlertId: z.uuid(),
    confidenceScore: z.number(),
    createdAt: z.coerce.date().optional(),
});

export type PetMatchType=z.infer<typeof petMatchSchema>;

export const isPetMatchRequestValid=(petMatchInfo:unknown)=>{
    return petMatchSchema.safeParse(petMatchInfo);
}