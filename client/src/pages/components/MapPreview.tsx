import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
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
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);

	const nearbyCoords = useMemo(() => {
		if (!coords) return [];
		return createNearbyCoords(coords, 10, 900);
	}, [coords]);
	useEffect(() => {
		const token = import.meta.env.VITE_MAPBOX_GL_ACCESS_TOKEN as
			| string
			| undefined;
		console.log("Mapbox token present:", !!token, token?.slice(0, 10));

		if (!token) {
			console.error("Missing VITE_MAPBOX_GL_ACCESS_TOKEN");
			return;
		}

		if (!mapContainerRef.current || mapRef.current) return;

		mapboxgl.accessToken = token;

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: "mapbox://styles/mapbox/dark-v11",
			center: coords ? [coords.long, coords.lat] : [26.1025, 44.4268],
			zoom: 14,
		});

		map.on("load", () => {
			console.log("Map loaded successfully");

			map.resize();
		});

		map.on("error", (e) => {
			console.error("Mapbox error:", e);
		});

		mapRef.current = map;

		return () => {
			map.remove();
			mapRef.current = null;
		};
	}, [coords]);
	useEffect(() => {
		if (!coords || !mapRef.current) return;
		mapRef.current.flyTo({
			center: [coords.long, coords.lat],
			zoom: 14,
			essential: true,
		});
	}, [coords]);
	return (
		<>
			<div
				ref={mapContainerRef}
				className="rounded"
				style={{ width: "100%", height: "400px", minHeight: "400px" }}
			/>
			{coords && (
				<PulseMarker coords={coords} mapRef={mapRef} type="emergency" />
			)}
			{nearbyCoords.map((point, idx) => (
				<PulseMarker
					key={`${point.lat}-${point.long}`}
					coords={point}
					mapRef={mapRef}
					type={idx % 2 === 0 ? "warning" : "item"}
				/>
			))}
		</>
	);
};
