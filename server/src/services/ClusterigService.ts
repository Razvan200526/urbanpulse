import { db } from "@server/db";
import {
	type PulseClusterType,
	type PulseType,
	pulse,
	pulseClusterMembers,
	pulseClusters,
	pulseConfirmation,
} from "@server/db/schema";
import { socketManager } from "@server/services/SocketManager";
import { logger } from "@server/utils/Logger";
import { PulseEnum } from "@shared/types";
import {
	DEFAULT_CITY_CENTER,
	GLOBAL_CRISIS_RADIUS_METERS,
	MANUAL_CRISIS_EXPIRATION_HOURS,
} from "@shared/utils/crisis";
import { eq, sql } from "drizzle-orm";

const CLUSTER_CONFIG = {
	radiusMeters: 700,
	timeWindowMinutes: 60,
	crisisThreshold: 2, // prag pentru semnal combinat: rapoarte independente + confirmări
	confidencePerReport: 15, // Scorul crește semnificativ per raport nou
	confidencePerConfirmation: 8,
	confirmationWeight: 0.5,
	maxConfidence: 100,
};

export class ClusteringService {
	private getClusterIncidentTypeId(pulseRecord: PulseType) {
		if (pulseRecord.type !== PulseEnum.Emergency) {
			return null;
		}

		return pulseRecord.incidentTypeId ?? null;
	}

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
				incidentTypeId: params.incidentTypeId,
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
		const clusterIncidentTypeId = this.getClusterIncidentTypeId(pulseRecord);

		// 1. Caută clustere existente de același tip, în raza de 700m, în fereastra de timp
		const existing = clusterIncidentTypeId
			? await db.execute(sql`
        SELECT c.* FROM pulse_clusters c
        WHERE c.incident_type_id = ${clusterIncidentTypeId}
          AND c.status != 'resolved'
          AND c.expires_at > NOW()
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(c.center_lng, c.center_lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${pulseRecord.position.x}, ${pulseRecord.position.y}), 4326)::geography,
            ${CLUSTER_CONFIG.radiusMeters}
          )
        ORDER BY c.report_count DESC
        LIMIT 1
      `)
			: await db.execute(sql`
        SELECT c.* FROM pulse_clusters c
        WHERE c.pulse_type = ${pulseRecord.type}
          AND c.incident_type_id IS NULL
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

	async recalculateClustersForPulse(pulseId: string): Promise<void> {
		const memberships = await db
			.select({ clusterId: pulseClusterMembers.clusterId })
			.from(pulseClusterMembers)
			.where(eq(pulseClusterMembers.pulseId, pulseId));
		const clusterIds = Array.from(
			new Set(
				memberships
					.map((membership) => membership.clusterId)
					.filter((clusterId): clusterId is string => Boolean(clusterId)),
			),
		);

		for (const clusterId of clusterIds) {
			const { cluster, confirmationCount } =
				await this.refreshClusterMetrics(clusterId);
			if (
				this.shouldTriggerCrisis(cluster.reportCount ?? 0, confirmationCount) &&
				!cluster.crisisTriggered
			) {
				await this.triggerCrisisMode(cluster);
			}
		}
	}

	private async addToCluster(
		clusterId: string,
		pulseRecord: PulseType,
	): Promise<PulseClusterType> {
		await db.insert(pulseClusterMembers).values({
			pulseId: pulseRecord.id,
			clusterId,
		});

		const { cluster: clusterData, confirmationCount } =
			await this.refreshClusterMetrics(clusterId);
		const reportCount = clusterData.reportCount ?? 0;

		if (
			this.shouldTriggerCrisis(reportCount, confirmationCount) &&
			!clusterData.crisisTriggered
		) {
			await this.triggerCrisisMode(clusterData);
			clusterData.status = "crisis";
			clusterData.crisisTriggered = true;
		}

		return clusterData;
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
		const incidentTypeId =
			(cluster.incidentTypeId as string | null | undefined) ??
			((cluster as any).incident_type_id as string | null) ??
			null;
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
				incident_type_id: incidentTypeId,
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
		const clusterIncidentTypeId = this.getClusterIncidentTypeId(pulseRecord);

		// Extract coordinates from position geometry
		const positionCoords = pulseRecord.position as { x: number; y: number };

		const created = await db
			.insert(pulseClusters)
			.values({
				pulseType: pulseRecord.type,
				incidentTypeId: clusterIncidentTypeId,
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

		await db.insert(pulseClusterMembers).values({
			pulseId: pulseRecord.id,
			clusterId: cluster.id,
		});

		const { cluster: refreshed, confirmationCount } =
			await this.refreshClusterMetrics(cluster.id);
		if (
			this.shouldTriggerCrisis(refreshed.reportCount ?? 0, confirmationCount) &&
			!refreshed.crisisTriggered
		) {
			await this.triggerCrisisMode(refreshed);
			refreshed.status = "crisis";
			refreshed.crisisTriggered = true;
		}

		return refreshed;
	}

	private shouldTriggerCrisis(
		independentReportCount: number,
		confirmationCount: number,
	) {
		const effectiveSignal =
			independentReportCount +
			confirmationCount * CLUSTER_CONFIG.confirmationWeight;
		return effectiveSignal >= CLUSTER_CONFIG.crisisThreshold;
	}

	private async refreshClusterMetrics(clusterId: string): Promise<{
		cluster: PulseClusterType;
		confirmationCount: number;
	}> {
		const [metrics] = await db
			.select({
				independentReportCount: sql<number>`COALESCE(COUNT(DISTINCT ${pulse.userId}), 0)`,
				confirmationCount: sql<number>`COALESCE(COUNT(DISTINCT ${pulseConfirmation.userId}), 0)`,
				centerLat: sql<number>`COALESCE(AVG(ST_Y(${pulse.position}::geometry)), 0)`,
				centerLng: sql<number>`COALESCE(AVG(ST_X(${pulse.position}::geometry)), 0)`,
			})
			.from(pulseClusterMembers)
			.innerJoin(pulse, eq(pulseClusterMembers.pulseId, pulse.id))
			.leftJoin(pulseConfirmation, eq(pulseConfirmation.pulseId, pulse.id))
			.where(eq(pulseClusterMembers.clusterId, clusterId));

		if (!metrics) {
			throw new Error("Failed to compute cluster metrics");
		}

		const confidenceScore = Math.min(
			CLUSTER_CONFIG.maxConfidence,
			metrics.independentReportCount * CLUSTER_CONFIG.confidencePerReport +
				metrics.confirmationCount * CLUSTER_CONFIG.confidencePerConfirmation,
		);

		const [updatedCluster] = await db
			.update(pulseClusters)
			.set({
				reportCount: metrics.independentReportCount,
				confidenceScore,
				centerLat: metrics.centerLat,
				centerLng: metrics.centerLng,
				updatedAt: new Date(),
			})
			.where(eq(pulseClusters.id, clusterId))
			.returning();

		if (!updatedCluster) {
			throw new Error("Failed to update cluster metrics");
		}

		return {
			cluster: updatedCluster,
			confirmationCount: metrics.confirmationCount,
		};
	}
}

export const clusteringService = new ClusteringService();
