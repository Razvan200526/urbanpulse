import { socketManager, type UserConnection } from "./SocketManager";

export class LocationService {
	/**
	 * @param pos
	 * @returns Active connections near the provided position.
	 */
	public getNearbyConnections(pos: { x: number; y: number }): UserConnection[] {
		return socketManager.getConnectionsInRange(pos, 500);
	}
}

export const locationService = new LocationService();
