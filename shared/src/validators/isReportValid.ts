import { endTime, startTime } from "hono/timing";
import * as z from "zod";

export const reportSchema = z.object({
    id: z.uuid(),
    userId: z.string("userId").nonempty(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    days: z.number(),
}).refine(data => data.startTime < data.endTime, {
    message: "startTime must be before endTime",
    path: ["startTime"],
}).refine(data => data.days > 0, {
    message: "days must be a positive number",
    path: ["days"],
});
export type ReportInfoType=z.infer<typeof reportSchema>;

export const isReportRequestValid=(skillInfo:unknown)=>{
   return reportSchema.safeParse(skillInfo)
}