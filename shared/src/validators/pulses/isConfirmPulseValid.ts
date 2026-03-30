import * as z from "zod";

export const confirmPulseParamsSchema = z.object({
	id: z.string().uuid(),
});

export type ConfirmPulseParamsType = z.infer<typeof confirmPulseParamsSchema>;
