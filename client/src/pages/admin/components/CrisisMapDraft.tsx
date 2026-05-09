import { useMap } from "@client/components/map/MapContext";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

export type DraftPoint = { lat: number; lng: number };

const createGeoJSONCircle = (
	center: [number, number],
	radiusInMeters: number,
	points = 64,
) => {
	const coords = {
		latitude: center[1],
		longitude: center[0],
	};
	const km = radiusInMeters / 1000;
	const ret: [number, number][] = [];
	const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
	const distanceY = km / 110.57;

	for (let i = 0; i < points; i++) {
		const theta = (i / points) * (2 * Math.PI);
		const x = distanceX * Math.cos(theta);
		const y = distanceY * Math.sin(theta);
		ret.push([coords.longitude + x, coords.latitude + y]);
	}

	ret.push(ret[0] as [number, number]);
	return {
		type: "FeatureCollection" as const,
		features: [
			{
				type: "Feature" as const,
				geometry: {
					type: "Polygon" as const,
					coordinates: [ret],
				},
				properties: {},
			},
		],
	};
};

export const AdminCrisisMapClickCapture = ({
	onMapClick,
}: {
	onMapClick: (point: DraftPoint) => void;
}) => {
	const map = useMap();

	useEffect(() => {
		if (!map) {
			return;
		}

		const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
			const lat = event?.lngLat?.lat;
			const lng = event?.lngLat?.lng;
			if (typeof lat !== "number" || typeof lng !== "number") {
				return;
			}
			onMapClick({ lat, lng });
		};

		map.on("click", handleMapClick);
		return () => {
			map.off("click", handleMapClick);
		};
	}, [map, onMapClick]);

	return null;
};

export const AdminDraftCrisisOverlay = ({
	draftPoint,
	radiusMeters,
}: {
	draftPoint: DraftPoint | null;
	radiusMeters: number;
}) => {
	const map = useMap();
	const markerRef = useRef<mapboxgl.Marker | null>(null);
	const sourceId = "admin-crisis-draft-radius-source";
	const fillLayerId = "admin-crisis-draft-radius-fill";
	const borderLayerId = "admin-crisis-draft-radius-border";

	useEffect(() => {
		if (!map?.getStyle()) {
			return;
		}

		if (!draftPoint) {
			markerRef.current?.remove();
			markerRef.current = null;

			if (map.getLayer(fillLayerId)) {
				map.removeLayer(fillLayerId);
			}
			if (map.getLayer(borderLayerId)) {
				map.removeLayer(borderLayerId);
			}
			if (map.getSource(sourceId)) {
				map.removeSource(sourceId);
			}
			return;
		}

		if (!markerRef.current) {
			markerRef.current = new mapboxgl.Marker({ color: "#ef4444" }).addTo(map);
		}
		markerRef.current.setLngLat([draftPoint.lng, draftPoint.lat]);

		const circleData = createGeoJSONCircle(
			[draftPoint.lng, draftPoint.lat],
			radiusMeters,
		);
		const existingSource = map.getSource(sourceId) as
			| mapboxgl.GeoJSONSource
			| undefined;

		if (existingSource) {
			existingSource.setData(circleData);
		} else {
			map.addSource(sourceId, { type: "geojson", data: circleData });
			map.addLayer({
				id: fillLayerId,
				type: "fill",
				source: sourceId,
				paint: {
					"fill-color": "#ef4444",
					"fill-opacity": 0.12,
				},
			});
			map.addLayer({
				id: borderLayerId,
				type: "line",
				source: sourceId,
				paint: {
					"line-color": "#ef4444",
					"line-width": 2,
					"line-dasharray": [2, 2],
					"line-opacity": 0.75,
				},
			});
		}

		return () => {
			if (!map.getStyle()) {
				return;
			}

			markerRef.current?.remove();
			markerRef.current = null;

			if (map.getLayer(fillLayerId)) {
				map.removeLayer(fillLayerId);
			}
			if (map.getLayer(borderLayerId)) {
				map.removeLayer(borderLayerId);
			}
			if (map.getSource(sourceId)) {
				map.removeSource(sourceId);
			}
		};
	}, [draftPoint, map, radiusMeters]);

	return null;
};
