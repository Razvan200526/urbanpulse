import * as z from "zod";

export const weatherAlertsQuerySchema = z.object({
	lat: z.coerce.number().min(-90).max(90),
	lon: z.coerce.number().min(-180).max(180),
});
