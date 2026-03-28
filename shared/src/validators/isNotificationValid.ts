import * as z from "zod";

export const notificationSchema=z.object({
    id:z.uuid(),
    userId:z.string("userId").nonempty(),
    type: z.enum([
        "HERO_ALERT",
        "PULSE_CONFIRMED",
        "MESSAGE",
        "TRANSACTION",
        "FEEDBACK",
    ]as const),
    payload:z.unknown(),
    read:z.boolean("read").default(false),
    createdAt:z.coerce.date(),
})

export type NotificationInfoType=z.infer<typeof notificationSchema>;

export const isNotificationRequestValid=(notificationInfo:unknown)=>{
    return notificationSchema.safeParse(notificationInfo);
}