import { socketManager, type UserConnection } from "./SocketManager";

export class LocationService {
	/**
	 * @param pos
	 * @returns An array of UserConnection[] type with connections near the position.If there aren't any nearby connections, returns all connections.
	 */
	public getNearbyConnections(pos: { x: number; y: number }): UserConnection[] {
		let connections = socketManager.getConnectionsInRange(pos, 500);

		//Fallback if there are no connections nearby
		if (connections.length === 0) {
			connections = socketManager.getAllConnections();
		}

		return connections;
	}
}

export const locationService = new LocationService();
