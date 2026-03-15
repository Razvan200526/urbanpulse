import mapboxgl, { type Map as MapboxMap } from "mapbox-gl";
import { useEffect, useRef } from "react";
import type { GeolocationCoords } from "../hooks/useGetGeolocation";

const colorClasses = {
	emergency: {
		core: "bg-red-500",
		ripple: "border-red-400/70",
		glow: "bg-red-400/35",
	},
	warning: {
		core: "bg-blue-500",
		ripple: "border-blue-400/70",
		glow: "bg-blue-400/35",
	},
	item: {
		core: "bg-green-500",
		ripple: "border-green-400/70",
		glow: "bg-green-400/35",
	},
};

export const PulseMarker = ({
	coords,
	type = "emergency",
	mapRef,
}: {
	coords: GeolocationCoords;
	type?: "emergency" | "warning" | "item";
	mapRef: React.RefObject<MapboxMap | null>;
}) => {
	const markerHostRef = useRef<HTMLDivElement | null>(null);
	const markerInstanceRef = useRef<mapboxgl.Marker | null>(null);

	useEffect(() => {
		if (!mapRef.current || !markerHostRef.current) return;

		const c = colorClasses[type];
		const markerEl = markerHostRef.current;

		markerEl.className = "relative w-8 h-8";
		markerEl.innerHTML = `
			<span class="absolute inset-0 rounded-full ${c.glow} blur-sm"></span>
			<span class="absolute inset-0 rounded-full border-2 ${c.ripple} animate-ping"></span>
			<span class="absolute inset-0 rounded-full border-2 ${c.ripple} animate-marker-ripple"></span>
			<span class="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${c.core} ring-2 ring-white shadow-md"></span>
		`;

		if (!markerInstanceRef.current) {
			markerInstanceRef.current = new mapboxgl.Marker({
				element: markerEl,
				draggable: false,
			})
				.setLngLat([coords.long, coords.lat])
				.addTo(mapRef.current);
		} else {
			markerInstanceRef.current.setLngLat([coords.long, coords.lat]);
		}

		return () => {
			markerInstanceRef.current?.remove();
			markerInstanceRef.current = null;
		};
	}, [coords.long, coords.lat, type, mapRef]);

	return <div ref={markerHostRef} />;
};
