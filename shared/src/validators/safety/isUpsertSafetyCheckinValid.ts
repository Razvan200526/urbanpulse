import { SafetyCheckinStatusEnum } from "@shared/types";
import { z } from "zod";

export const upsertSafetyCheckinSchema = z.object({
	status: z.nativeEnum(SafetyCheckinStatusEnum),
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
});

export type UpsertSafetyCheckinType = z.infer<typeof upsertSafetyCheckinSchema>;
