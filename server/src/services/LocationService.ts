import { socketManager, type UserConnection } from "./SocketManager";
import type { MapboxResponse } from "@server/types";


export class LocationService {
  private mapboxApiKey: string;
  private mapBoxUrl: string;
  constructor() {
    this.mapboxApiKey = Bun.env.MAPBOX_API_KEY;
    this.mapBoxUrl = Bun.env.MAPBOX_URL;
  }
  /**
   * @param pos
   * @returns Active connections near the provided position.
   */
  public getNearbyConnections(
    pos: { x: number; y: number },
    radiusInMeters = 500,
  ): UserConnection[] {
    return socketManager.getConnectionsInRange(pos, radiusInMeters);
  }

  async getAddressByCoords(pos: { x: number; y: number }) {
    if (!this.mapBoxUrl || !this.mapboxApiKey) {
      return undefined;
    }

    const [longitude, latitude] = [pos.x, pos.y];
    const url = new URL("reverse", `${this.mapBoxUrl.replace(/\/$/, "")}/`);
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("access_token", this.mapboxApiKey);

    const response = await fetch(url);
    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as MapboxResponse;
    const address = data.features.find(
      (f) => f.properties.feature_type === "address",
    );

    return address?.properties.full_address;
  }
}

export const locationService = new LocationService();
