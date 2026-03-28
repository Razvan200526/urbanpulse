import { endTime, startTime } from "hono/timing";
import * as z from "zod";

export const quietHoursSchema = z.object({
    id: z.uuid(),
    userId: z.string("userId").nonempty(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    days: z.array(z.string()), // or adjust based on what days represents
}).refine(data => data.startTime < data.endTime, {
    message: "startTime must be before endTime",
    path: ["startTime"],
});

export type QuietHoursType=z.infer<typeof quietHoursSchema>;

export const isQuietHoursRequestValid=(quietHoursInfo:unknown)=>{
    return quietHoursSchema.safeParse(quietHoursInfo);
}