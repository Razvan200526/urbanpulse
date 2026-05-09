import * as z from "zod";

export const clusterRetrieveQuerySchema = z.object({
	lat: z.coerce.number().min(-90).max(90),
	lng: z.coerce.number().min(-180).max(180),
	radius: z.coerce.number().min(100).max(10000).optional().default(1000),
});

export type ClusterRetrieveQueryType = z.infer<
	typeof clusterRetrieveQuerySchema
>;
