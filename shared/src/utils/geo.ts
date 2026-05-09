/**
 * Calculates the distance between two points in meters using the Haversine formula.
 */
export const calculateDistance = (
	point1: { lat: number; lng: number },
	point2: { lat: number; lng: number },
) => {
	const R = 6371e3; // Earth's radius in meters
	const phi1 = (point1.lat * Math.PI) / 180;
	const phi2 = (point2.lat * Math.PI) / 180;
	const deltaPhi = ((point2.lat - point1.lat) * Math.PI) / 180;
	const deltaLambda = ((point2.lng - point1.lng) * Math.PI) / 180;

	const a =
		Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
		Math.cos(phi1) *
			Math.cos(phi2) *
			Math.sin(deltaLambda / 2) *
			Math.sin(deltaLambda / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c; // distance in meters
};
