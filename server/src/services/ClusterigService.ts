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

type ClusterSnakeCaseRow = {
	center_lng: number;
	center_lat: number;
	radius_meters?: number | null;
	pulse_type: string;
	incident_type_id?: string | null;
	report_count?: number | null;
	confidence_score?: number | null;
};

type ClusterLike = PulseClusterType | ClusterSnakeCaseRow;

type NormalizedCluster = {
	centerLng: number;
	centerLat: number;
	radiusMeters: number;
	pulseType: string;
	incidentTypeId: string | null;
	reportCount: number | null;
	confidenceScore: number;
};

export class ClusteringService {
	private normalizeCluster(cluster: ClusterLike): NormalizedCluster {
		if ("centerLng" in cluster) {
			return {
				centerLng: cluster.centerLng,
				centerLat: cluster.centerLat,
				radiusMeters: cluster.radiusMeters ?? CLUSTER_CONFIG.radiusMeters,
				pulseType: cluster.pulseType,
				incidentTypeId: cluster.incidentTypeId ?? null,
				reportCount: cluster.reportCount ?? null,
				confidenceScore: cluster.confidenceScore ?? 100,
			};
		}

		return {
			centerLng: cluster.center_lng,
			centerLat: cluster.center_lat,
			radiusMeters: cluster.radius_meters ?? CLUSTER_CONFIG.radiusMeters,
			pulseType: cluster.pulse_type,
			incidentTypeId: cluster.incident_type_id ?? null,
			reportCount: cluster.report_count ?? null,
			confidenceScore: cluster.confidence_score ?? 100,
		};
	}

	private isGlobalCluster(cluster: PulseClusterType) {
		const normalized = this.normalizeCluster(cluster);
		return normalized.radiusMeters >= GLOBAL_CRISIS_RADIUS_METERS;
	}

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

	async getActiveCrisisClusters(): Promise<PulseClusterType[]> {
		const results = await db.execute(sql`
			SELECT * FROM pulse_clusters
			WHERE status = 'crisis'
			  AND expires_at > NOW()
			  AND pulse_type = ${PulseEnum.Emergency}
			ORDER BY updated_at DESC
		`);

		return results.rows as unknown as PulseClusterType[];
	}

	async deactivateCrisisCluster(clusterId: string): Promise<{
		cluster: PulseClusterType;
		scope: "global" | "local";
	} | null> {
		const [cluster] = await db
			.select()
			.from(pulseClusters)
			.where(eq(pulseClusters.id, clusterId))
			.limit(1);
		if (!cluster || cluster.status !== "crisis") {
			return null;
		}

		const [updatedCluster] = await db
			.update(pulseClusters)
			.set({
				status: "resolved",
				updatedAt: new Date(),
			})
			.where(eq(pulseClusters.id, clusterId))
			.returning();
		if (!updatedCluster) {
			return null;
		}

		const isGlobal = this.isGlobalCluster(updatedCluster);
		this.broadcastCrisisModeDeactivated(updatedCluster, isGlobal);
		return {
			cluster: updatedCluster,
			scope: isGlobal ? "global" : "local",
		};
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
		const normalized = this.normalizeCluster(cluster);

		const center = { x: normalized.centerLng, y: normalized.centerLat };
		const connections = isGlobal
			? socketManager.getAllConnections()
			: socketManager.getConnectionsInRange(center, normalized.radiusMeters);
		const message = {
			type: "CRISIS_MODE_ACTIVATED",
			cluster: {
				id: cluster.id,
				pulse_type: normalized.pulseType,
				incident_type_id: normalized.incidentTypeId,
				report_count: normalized.reportCount,
				confidence_score: normalized.confidenceScore,
				radius_meters: normalized.radiusMeters,
				center_lat: normalized.centerLat,
				center_lng: normalized.centerLng,
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

	private broadcastCrisisModeDeactivated(
		cluster: PulseClusterType,
		isGlobal: boolean,
	) {
		const normalized = this.normalizeCluster(cluster);
		const center = { x: normalized.centerLng, y: normalized.centerLat };
		const connections = isGlobal
			? socketManager.getAllConnections()
			: socketManager.getConnectionsInRange(center, normalized.radiusMeters);
		const message = {
			type: "CRISIS_MODE_DEACTIVATED",
			cluster: {
				id: cluster.id,
				pulse_type: normalized.pulseType,
				incident_type_id: normalized.incidentTypeId,
				report_count: normalized.reportCount,
				confidence_score: normalized.confidenceScore,
				radius_meters: normalized.radiusMeters,
				center_lat: normalized.centerLat,
				center_lng: normalized.centerLng,
				status: "resolved",
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
