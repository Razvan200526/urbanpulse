// import type { PulseType } from "@server/db/schema";
// import { isPulseDataValid } from "@shared/validators/pulses/isPulseDataValid";
// import { locationService, type LocationService } from "./LocationService";
// export class BroadcastService {
// 	private locationService: LocationService;

// 	constructor() {
// 		this.locationService = locationService;
// 	}

// 	public broadcastToNearbyUsers(pulseData: Partial<PulseType>) {
// 		const { data, success } = isPulseDataValid(pulseData);
// 		if (!success) return;
// 		const nearbyConnections = this.locationService.getNearbyConnections(
// 			data.position,
// 		);
// 	}
// }
