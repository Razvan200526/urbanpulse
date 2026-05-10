import { db } from "@server/db";
import { safetyCheckin } from "@server/db/schema";
import type { RetrieveSafetyCheckinsQueryType } from "@shared/validators/safety/isRetrieveSafetyCheckinsValid";
import type { UpsertSafetyCheckinType } from "@shared/validators/safety/isUpsertSafetyCheckinValid";
import { sql } from "drizzle-orm";

const SAFETY_CHECKIN_EXPIRATION_HOURS = 12;

const toIsoString = (value: unknown) => {
	if (value instanceof Date) {
		return value.toISOString();
	}
	return new Date(String(value)).toISOString();
};

export type SafetyCheckinView = {
	id: string;
	userId: string;
	userName: string;
	userImage: string | null;
	status: string;
	lat: number;
	lng: number;
	updatedAt: string;
	expiresAt: string;
	isMe: boolean;
};

export class SafetyCheckinService {
	async upsert(userId: string, payload: UpsertSafetyCheckinType) {
		const expiresAt = new Date(
			Date.now() + SAFETY_CHECKIN_EXPIRATION_HOURS * 60 * 60 * 1000,
		);

		const [record] = await db
			.insert(safetyCheckin)
			.values({
				userId,
				status: payload.status,
				position: { x: payload.lng, y: payload.lat },
				expiresAt,
			})
			.onConflictDoUpdate({
				target: safetyCheckin.userId,
				set: {
					status: payload.status,
					position: { x: payload.lng, y: payload.lat },
					updatedAt: new Date(),
					expiresAt,
				},
			})
			.returning();

		return record ?? null;
	}

	async listNearby(
		userId: string,
		query: RetrieveSafetyCheckinsQueryType,
	): Promise<SafetyCheckinView[]> {
		const result = await db.execute(sql`
      SELECT
        sc.id,
        sc.user_id,
        u.name AS user_name,
        u.image AS user_image,
        sc.status,
        ST_Y(sc.location::geometry) AS lat,
        ST_X(sc.location::geometry) AS lng,
        sc.updated_at,
        sc.expires_at,
        ST_Distance(
          sc.location::geography,
          ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography
        ) AS distance_meters
      FROM safety_checkin sc
      JOIN "user" u ON u.id = sc.user_id
      WHERE sc.expires_at > NOW()
        AND ST_DWithin(
          sc.location::geography,
          ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
          ${query.radius}
        )
      ORDER BY distance_meters ASC, sc.updated_at DESC
      LIMIT 200
    `);

		return result.rows.map((row) => {
			const item = row as Record<string, unknown>;
			return {
				id: String(item.id),
				userId: String(item.user_id),
				userName: String(item.user_name ?? "Unknown user"),
				userImage: typeof item.user_image === "string" ? item.user_image : null,
				status: String(item.status),
				lat: Number(item.lat),
				lng: Number(item.lng),
				updatedAt: toIsoString(item.updated_at),
				expiresAt: toIsoString(item.expires_at),
				isMe: String(item.user_id) === userId,
			};
		});
	}
}

export const safetyCheckinService = new SafetyCheckinService();
