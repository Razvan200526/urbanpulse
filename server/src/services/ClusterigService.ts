import { db } from "@server/db";
import { sql } from "drizzle-orm";
import {
    pulseClusters,
    pulseClusterMembers,
    pulse,
    type PulseClusterType,
    type PulseType,
} from "@server/db/schema";
import { socketManager } from "@server/services/SocketManager";

const CLUSTER_CONFIG = {
    radiusMeters: 700,
    timeWindowMinutes: 60,
    crisisThreshold: 5, // câte rapoarte declanșează Crisis Mode
    confidencePerReport: 3.5, // contribuție per raport la scor
};

export class ClusteringService {
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

        const clusterData = updated.rows[0] as Record<string, unknown> | undefined;
        if (!clusterData) {
            throw new Error("Failed to update cluster");
        }

        const cluster: PulseClusterType = clusterData as PulseClusterType;

        // Verifică dacă se declanșează Crisis Mode
        if (
            (cluster.reportCount ?? 0) >= CLUSTER_CONFIG.crisisThreshold &&
            !cluster.crisisTriggered
        ) {
            await this.triggerCrisisMode(cluster);
        }

        return cluster;
    }

    private async triggerCrisisMode(cluster: PulseClusterType): Promise<void> {
        await db.execute(sql`
      UPDATE pulse_clusters 
      SET status = 'crisis', crisis_triggered = true
      WHERE id = ${cluster.id}
    `);

        // Notifică prin WebSocket toți userii din raza clusterului
        const center = { x: cluster.centerLng, y: cluster.centerLat };
        const connectionsInRange = socketManager.getConnectionsInRange(
            center,
            CLUSTER_CONFIG.radiusMeters,
        );

        const message = {
            type: "CRISIS_MODE_ACTIVATED",
            cluster: {
                id: cluster.id,
                pulseType: cluster.pulseType,
                reportCount: cluster.reportCount,
                confidenceScore: cluster.confidenceScore,
                radiusMeters: CLUSTER_CONFIG.radiusMeters,
            },
        };

        for (const conn of connectionsInRange) {
            try {
                conn.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error(`Failed to send message to user ${conn.userId}:`, error);
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

        if (!created[0]) {
            throw new Error("Failed to create cluster");
        }

        await db.insert(pulseClusterMembers).values({
            pulseId: pulseRecord.id,
            clusterId: created[0].id,
        });

        return created[0];
    }
}
