//check if this is needed or not!!!

/*import * as z from "zod";
import { PulseEnum, UrgencyEnum } from "@shared/types";

export const pulseSchema = z.object({
    id: z.uuid(),
    type: z.enum(PulseEnum).default(PulseEnum.Emergency),
    userId: z.string().nonempty(),
    urgency: z.enum(UrgencyEnum),
    title: z.string().min(1).max(30),
    description: z.string().optional(),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }),
    status: z.string(), // Replace with proper enum once defined
    pulseUploadState: z.string(), // Replace with proper enum once defined
    isResolved: z.boolean().default(false),
    isVerified: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
});

export type PulseType = z.infer<typeof pulseSchema>;

export const isPulseRequestValid = (pulseInfo: unknown) => {
    return pulseSchema.safeParse(pulseInfo);
};*/