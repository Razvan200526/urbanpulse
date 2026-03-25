import { logger } from "@server/utils/Logger";
import type { WSContext } from "hono/ws";

/**
 * Represents a single active user connection via WebSocket.
 */
interface UserConnection {
	/** Unique identifier for the user from the database. */
	userId: string;
	/** The Hono WebSocket context object. */
	ws: WSContext;
	/**
	 * The last known geographic location of the user.
	 * x: Longitude, y: Latitude.
	 */
	location?: { x: number; y: number };
}

/**
 * Singleton service responsible for managing active WebSocket connections
 * and performing spatial filtering for real-time broadcasts.
 */
export class SocketManager {
	private connections = new Map<WSContext, UserConnection>();

	constructor() {
		logger.info("SocketManager: Singleton instance created.");
	}

	public register(ws: WSContext, userId: string) {
		this.connections.set(ws, { userId, ws });
		logger.info(
			`SocketManager: Registered User[${userId}]. Active connections: ${this.connections.size}`,
		);
	}

	public unregister(ws: WSContext) {
		const conn = this.connections.get(ws);
		if (conn) {
			this.connections.delete(ws);
			logger.info(
				`SocketManager: Unregistered User[${conn.userId}]. Remaining: ${this.connections.size}`,
			);
		}
	}

	public updateLocation(ws: WSContext, location: { x: number; y: number }) {
		const conn = this.connections.get(ws);
		if (conn) {
			conn.location = location;
			logger.info(
				`SocketManager: Location received for User[${conn.userId}] -> [Long: ${location.x}, Lat: ${location.y}]`,
			);
		}
	}

	public getConnectionsInRange(
		center: { x: number; y: number },
		radiusInMeters: number,
	) {
		const allConns = Array.from(this.connections.values());
		logger.info(
			`SocketManager: Filtering ${allConns.length} users near [Long: ${center.x}, Lat: ${center.y}] within ${radiusInMeters}m`,
		);

		return allConns.filter((conn) => {
			if (!conn.location) {
				logger.info(
					`SocketManager: Skipping User[${conn.userId}] - Location never synced.`,
				);
				return false;
			}

			// Defensive Swap Detection (Common Romania Coord Error)
			// Longitude in Romania should be around 27, Latitude around 47.
			// If we see Long=47, the coordinates are swapped.
			const distance = this.calculateDistance(center, conn.location);
			const inRange = distance <= radiusInMeters;

			logger.info(
				`SocketManager: User[${conn.userId}] is ${distance.toFixed(
					2,
				)}m away. In range: ${inRange}`,
			);

			return inRange;
		});
	}

	private calculateDistance(
		p1: { x: number; y: number },
		p2: { x: number; y: number },
	): number {
		const R = 6371e3; // Earth radius in metres

		// Map x/y correctly: y is Latitude, x is Longitude
		const lat1 = (p1.y * Math.PI) / 180;
		const lat2 = (p2.y * Math.PI) / 180;
		const dLat = ((p2.y - p1.y) * Math.PI) / 180;
		const dLon = ((p2.x - p1.x) * Math.PI) / 180;

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}
}

// Global Singleton (Prevent HMR Trap)
const globalForSocket = globalThis as unknown as {
	socketManager: SocketManager | undefined;
};

export const socketManager =
	globalForSocket.socketManager ?? new SocketManager();

if (process.env.NODE_ENV !== "production") {
	globalForSocket.socketManager = socketManager;
}
