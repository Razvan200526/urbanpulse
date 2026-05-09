import { z } from "zod";

export const clientClusterSchema = z
	.object({
		id: z.string(),
		pulse_type: z.string(),
		center_lat: z.coerce.number(),
		center_lng: z.coerce.number(),
		radius_meters: z.coerce.number(),
		report_count: z.coerce.number().nullish(),
		confidence_score: z.coerce.number().nullish(),
		status: z.string(),
		crisis_triggered: z.coerce.boolean().nullish(),
		created_at: z.string().nullish(),
		updated_at: z.string().nullish(),
		expires_at: z.string().nullish(),
	})
	.transform((val) => ({
		id: val.id,
		pulseType: val.pulse_type,
		centerLat: val.center_lat,
		centerLng: val.center_lng,
		radiusMeters: val.radius_meters,
		reportCount: val.report_count ?? 0,
		confidenceScore: val.confidence_score ?? 0,
		status: val.status as "active" | "crisis" | "resolved",
		crisisTriggered: !!val.crisis_triggered,
		createdAt: val.created_at ?? null,
		updatedAt: val.updated_at ?? null,
		expiresAt: val.expires_at ?? null,
	}));

export type ClientClusterType = {
	id: string;
	pulseType: string;
	centerLat: number;
	centerLng: number;
	radiusMeters: number;
	reportCount: number | null;
	confidenceScore: number | null;
	status: "active" | "crisis" | "resolved";
	crisisTriggered: boolean | null;
	createdAt: string | null;
	updatedAt: string | null;
	expiresAt: string | null;
};

export const clusterArraySchema = z.array(clientClusterSchema);
