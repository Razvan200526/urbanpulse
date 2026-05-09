import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@server/middleware/authMiddleware";
import { clusteringService } from "@server/services/ClusterigService";
import { safetyCheckinService } from "@server/services/SafetyCheckinService";
import { retrieveSafetyCheckinsQuerySchema } from "@shared/validators/safety/isRetrieveSafetyCheckinsValid";
import { upsertSafetyCheckinSchema } from "@shared/validators/safety/isUpsertSafetyCheckinValid";
import { Hono } from "hono";

const ensureCrisisMode = async (lat: number, lng: number) => {
	const clusters = await clusteringService.getActiveClusters({
		x: lng,
		y: lat,
		radiusMeters: 500,
	});

	return clusters.some((cluster) => cluster.status === "crisis");
};

export const safetyCheckinController = new Hono()
	.basePath("/safety")
	.use(authMiddleware)
	.post(
		"/check-in",
		zValidator("json", upsertSafetyCheckinSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}

			const payload = c.req.valid("json");
			const hasCrisis = await ensureCrisisMode(payload.lat, payload.lng);
			if (!hasCrisis) {
				return c.json(
					{
						success: false,
						message: "Safety check-ins are available only during Crisis Mode",
						data: null,
					},
					403,
				);
			}

			const record = await safetyCheckinService.upsert(session.userId, payload);
			if (!record) {
				return c.json(
					{
						success: false,
						message: "Failed to update safety status",
						data: null,
					},
					500,
				);
			}

			return c.json({
				success: true,
				message: "Safety status updated",
				data: {
					id: record.id,
					userId: record.userId,
					status: record.status,
					lat: payload.lat,
					lng: payload.lng,
					updatedAt: record.updatedAt,
					expiresAt: record.expiresAt,
				},
			});
		},
	)
	.get(
		"/check-ins",
		zValidator("query", retrieveSafetyCheckinsQuerySchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}

			const query = c.req.valid("query");
			const hasCrisis = await ensureCrisisMode(query.lat, query.lng);
			if (!hasCrisis) {
				return c.json({
					success: true,
					message: "No active crisis mode near this area",
					data: { checkins: [], mine: null },
				});
			}

			const checkins = await safetyCheckinService.listNearby(
				session.userId,
				query,
			);
			const mine = checkins.find((item) => item.isMe) ?? null;

			return c.json({
				success: true,
				message: "Safety check-ins retrieved",
				data: { checkins, mine },
			});
		},
	);
