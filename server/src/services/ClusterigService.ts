import { db } from "@server/db";
import {
	type PulseClusterType,
	type PulseType,
	pulse,
	pulseClusterMembers,
	pulseClusters,
} from "@server/db/schema";
import { socketManager } from "@server/services/SocketManager";
import { logger } from "@server/utils/Logger";
import { PulseEnum } from "@shared/types";
import {
	DEFAULT_CITY_CENTER,
	GLOBAL_CRISIS_RADIUS_METERS,
	MANUAL_CRISIS_EXPIRATION_HOURS,
} from "@shared/utils/crisis";
import { sql } from "drizzle-orm";

const CLUSTER_CONFIG = {
	radiusMeters: 700,
	timeWindowMinutes: 60,
	crisisThreshold: 2, // număr de rapoarte INDEPENDENTE pentru Crisis Mode
	confidencePerReport: 15, // Scorul crește semnificativ per raport nou
	maxConfidence: 100,
};

export class ClusteringService {
	async createAdminCrisisCluster(params: {
		scope: "local" | "global";
		incidentTypeId: string;
		lat?: number;
		lng?: number;
		radius?: number;
	}): Promise<PulseClusterType> {
		const isGlobal = params.scope === "global";
		const centerLat = isGlobal
			? DEFAULT_CITY_CENTER.lat
			: (params.lat as number);
		const centerLng = isGlobal
			? DEFAULT_CITY_CENTER.lng
			: (params.lng as number);
		const radiusMeters = isGlobal
			? GLOBAL_CRISIS_RADIUS_METERS
			: (params.radius as number);
		const expiresAt = new Date(
			Date.now() + MANUAL_CRISIS_EXPIRATION_HOURS * 60 * 60 * 1000,
		);

		const created = await db
			.insert(pulseClusters)
			.values({
				pulseType: PulseEnum.Emergency,
				centerLat,
				centerLng,
				radiusMeters,
				reportCount: null,
				confidenceScore: 100,
				status: "crisis",
				crisisTriggered: true,
				expiresAt,
			})
			.returning();

		const cluster = created[0];
		if (!cluster) {
			throw new Error("Failed to create manual crisis cluster");
		}

		this.broadcastCrisisMode(cluster, isGlobal);
		return cluster;
	}

	/**
	 * Returns active clusters within a specific radius of a location.
	 */
	async getActiveClusters(params: {
		x: number;
		y: number;
		radiusMeters: number;
	}): Promise<PulseClusterType[]> {
		const results = await db.execute(sql`
      SELECT * FROM pulse_clusters
      WHERE status != 'resolved'
        AND expires_at > NOW()
        AND (
          ST_DWithin(
            ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${params.x}, ${params.y}), 4326)::geography,
            ${params.radiusMeters}
          )
          OR ST_DWithin(
            ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${params.x}, ${params.y}), 4326)::geography,
            radius_meters
          )
        )
      ORDER BY confidence_score DESC
    `);

		return results.rows as unknown as PulseClusterType[];
	}

	async findOrCreateCluster(pulseRecord: PulseType): Promise<PulseClusterType> {
		// 1. Caută clustere existente de același tip, în raza de 700m, în fereastra de timp
		const existing = await db.execute(sql`
      SELECT c.* FROM pulse_clusters c
      WHERE c.pulse_type = ${pulseRecord.type}
        AND c.status != 'resolved'
        AND c.expires_at > NOW()
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(c.center_lng, c.center_lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${pulseRecord.position.x}, ${pulseRecord.position.y}), 4326)::geography,
          ${CLUSTER_CONFIG.radiusMeters}
        )
      ORDER BY c.report_count DESC
      LIMIT 1
    `);

		if (existing.rows.length > 0) {
			const clusterId = (existing.rows[0] as Record<string, unknown>)
				?.id as string;
			return this.addToCluster(clusterId, pulseRecord);
		}

		return this.createCluster(pulseRecord);
	}

	private async addToCluster(
		clusterId: string,
		pulseRecord: PulseType,
	): Promise<PulseClusterType> {
		// Recalculează centrul geografic (centroid al tuturor pulse-urilor din cluster)
		const updated = await db.execute(sql`
      UPDATE pulse_clusters SET
        report_count = report_count + 1,
        confidence_score = LEAST(99, confidence_score + ${CLUSTER_CONFIG.confidencePerReport}),
        center_lat = (
          SELECT AVG(ST_Y(location::geometry)) FROM ${pulse} p
          JOIN ${pulseClusterMembers} m ON m.pulse_id = p.id
          WHERE m.cluster_id = ${clusterId}
        ),
        center_lng = (
          SELECT AVG(ST_X(location::geometry)) FROM ${pulse} p
          JOIN ${pulseClusterMembers} m ON m.pulse_id = p.id
          WHERE m.cluster_id = ${clusterId}
        ),
        updated_at = NOW()
      WHERE id = ${clusterId}
      RETURNING *
    `);

		await db.insert(pulseClusterMembers).values({
			pulseId: pulseRecord.id,
			clusterId,
		});

		const clusterData = updated.rows[0] as any;
		if (!clusterData) {
			throw new Error("Failed to update cluster");
		}

		// Verifică dacă se declanșează Crisis Mode (Folosim snake_case din DB)
		const reportCount =
			clusterData.report_count ?? clusterData.reportCount ?? 0;
		const crisisTriggered =
			clusterData.crisis_triggered ?? clusterData.crisisTriggered ?? false;

		if (reportCount >= CLUSTER_CONFIG.crisisThreshold && !crisisTriggered) {
			await this.triggerCrisisMode(clusterData);
			// Update local object so the response reflects the crisis immediately
			clusterData.status = "crisis";
			clusterData.crisis_triggered = true;
		}

		return clusterData as PulseClusterType;
	}

	private async triggerCrisisMode(cluster: PulseClusterType): Promise<void> {
		await db.execute(sql`
      UPDATE pulse_clusters
      SET status = 'crisis', crisis_triggered = true
      WHERE id = ${cluster.id}
    `);

		this.broadcastCrisisMode(cluster, false);
	}

	private broadcastCrisisMode(cluster: PulseClusterType, isGlobal: boolean) {
		// Notifică prin WebSocket utilizatorii afectați
		const centerLng =
			(cluster.centerLng as number | null | undefined) ??
			((cluster as any).center_lng as number);
		const centerLat =
			(cluster.centerLat as number | null | undefined) ??
			((cluster as any).center_lat as number);
		const radiusMeters =
			(cluster.radiusMeters as number | null | undefined) ??
			((cluster as any).radius_meters as number) ??
			CLUSTER_CONFIG.radiusMeters;
		const pulseType =
			(cluster.pulseType as string | null | undefined) ??
			((cluster as any).pulse_type as string);
		const reportCount =
			(cluster.reportCount as number | null | undefined) ??
			((cluster as any).report_count as number | null) ??
			null;
		const confidenceScore =
			(cluster.confidenceScore as number | null | undefined) ??
			((cluster as any).confidence_score as number | null) ??
			100;

		const center = { x: centerLng, y: centerLat };
		const connections = isGlobal
			? socketManager.getAllConnections()
			: socketManager.getConnectionsInRange(center, radiusMeters);
		const message = {
			type: "CRISIS_MODE_ACTIVATED",
			cluster: {
				id: cluster.id,
				pulse_type: pulseType,
				report_count: reportCount,
				confidence_score: confidenceScore,
				radius_meters: radiusMeters,
				center_lat: centerLat,
				center_lng: centerLng,
				status: "crisis",
			},
		};

		for (const conn of connections) {
			try {
				conn.ws.send(JSON.stringify(message));
			} catch (error) {
				logger.error(`Failed to send message to user ${conn.userId}: ${error}`);
			}
		}
	}

	private async createCluster(
		pulseRecord: PulseType,
	): Promise<PulseClusterType> {
		// Extract coordinates from position geometry
		const positionCoords = pulseRecord.position as { x: number; y: number };

		const created = await db
			.insert(pulseClusters)
			.values({
				pulseType: pulseRecord.type,
				centerLat: positionCoords.y,
				centerLng: positionCoords.x,
				radiusMeters: CLUSTER_CONFIG.radiusMeters,
				reportCount: 1,
				confidenceScore: CLUSTER_CONFIG.confidencePerReport,
				status: "active",
				crisisTriggered: false,
				expiresAt: new Date(
					Date.now() + CLUSTER_CONFIG.timeWindowMinutes * 60 * 1000,
				),
			})
			.returning();

		const cluster = created[0];
		if (!cluster) {
			throw new Error("Failed to create cluster");
		}

		// Check if threshold is 1 (unlikely but for consistency)
		if (
			(cluster.reportCount ?? 0) >= CLUSTER_CONFIG.crisisThreshold &&
			!cluster.crisisTriggered
		) {
			await this.triggerCrisisMode(cluster);
			cluster.status = "crisis";
			cluster.crisisTriggered = true;
		}

		await db.insert(pulseClusterMembers).values({
			pulseId: pulseRecord.id,
			clusterId: cluster.id,
		});

		return cluster;
	}
}

export const clusteringService = new ClusteringService();
