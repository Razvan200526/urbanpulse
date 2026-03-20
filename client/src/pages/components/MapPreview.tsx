import { useMemo } from "react";
// biome-ignore lint/suspicious/noShadowRestrictedNames: Component is named Map
import { Map } from "../../components/map/Map";
import { PulseMarker } from "../../components/PulseMarker";
import {
	type GeolocationCoords,
	useGetGeolocation,
} from "../../hooks/useGetGeolocation";

function createNearbyCoords(
	center: GeolocationCoords,
	count = 8,
	radiusMeters = 800,
): GeolocationCoords[] {
	const earthRadius = 6371000;
	const latRad = (center.lat * Math.PI) / 180;

	return Array.from({ length: count }, (_, i) => {
		const angle = (2 * Math.PI * i) / count;
		const distance = radiusMeters * (0.6 + Math.random() * 0.7);

		const dLat = (distance * Math.cos(angle)) / earthRadius;
		const dLng =
			(distance * Math.sin(angle)) / (earthRadius * Math.cos(latRad));

		return {
			lat: center.lat + (dLat * 180) / Math.PI,
			long: center.long + (dLng * 180) / Math.PI,
		};
	});
}
export const MapComponent = () => {
	const { coords } = useGetGeolocation();

	const nearbyCoords = useMemo(() => {
		if (!coords) return [];
		return createNearbyCoords(coords, 10, 900);
	}, [coords]);

	return (
		<Map
			center={coords ? [coords.long, coords.lat] : [26.1025, 44.4268]}
			zoom={14}
			className="rounded"
			style={{ width: "100%", height: "400px", minHeight: "400px" }}
		>
			{coords && <PulseMarker coords={coords} type="emergency" />}
			{nearbyCoords.map((point, idx) => (
				<PulseMarker
					key={`${point.lat}-${point.long}`}
					coords={point}
					type={idx % 2 === 0 ? "warning" : "item"}
				/>
			))}
		</Map>
	);
};
