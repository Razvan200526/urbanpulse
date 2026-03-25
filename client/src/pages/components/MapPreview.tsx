import { useMemo } from "react";
import { MapComponent } from "../../components/map/MapComponent";
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
export const MapPreview = () => {
	const { coords } = useGetGeolocation();

	const nearbyCoords = useMemo(() => {
		if (!coords) return [];
		return createNearbyCoords(coords, 10, 900);
	}, [coords]);

	return (
		<MapComponent
			center={coords ? [coords.long, coords.lat] : [26.1025, 44.4268]}
			zoom={14}
			className="rounded"
			style={{ width: "100%", height: "400px", minHeight: "400px" }}
		>
			{coords && (
				<PulseMarker
					position={{ x: coords.lat, y: coords.long }}
					type="emergency"
				/>
			)}
			{nearbyCoords.map((point, idx) => (
				<PulseMarker
					key={`${point.lat}-${point.long}`}
					position={{ x: point.lat, y: point.long }}
					type={idx % 2 === 0 ? "warning" : "item"}
				/>
			))}
		</MapComponent>
	);
};
