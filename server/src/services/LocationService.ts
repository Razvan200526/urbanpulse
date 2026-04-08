import { cacheManager } from "@server/services/cache/CacheManager";
import { socketManager, type UserConnection } from "./SocketManager";

export class LocationService {
	private cache = cacheManager;

	/**
	 * @param pos
	 * @returns Active connections near the provided position.
	 */
	public getNearbyConnections(pos: { x: number; y: number }): UserConnection[] {
		return socketManager.getConnectionsInRange(pos, 500);
	}
}

export const locationService = new LocationService();
