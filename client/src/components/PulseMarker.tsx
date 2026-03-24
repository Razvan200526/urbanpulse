import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useMap } from "./map/MapContext";

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
	position,
	type = "emergency",
}: {
	position: { x: number; y: number };
	type?: "emergency" | "warning" | "item";
}) => {
	const map = useMap();
	const markerRef = useRef<mapboxgl.Marker | null>(null);
	const markerElementRef = useRef(document.createElement("div"));

	useEffect(() => {
		if (!map) return;

		// Initialize the marker when the component mounts
		// position.y = longitude, position.x = latitude
		markerRef.current = new mapboxgl.Marker({
			element: markerElementRef.current,
		})
			.setLngLat([position.y, position.x])
			.addTo(map);

		// Remove the marker when the component unmounts
		return () => {
			if (markerRef.current) {
				markerRef.current.remove();
			}
		};
	}, [map, position.x, position.y]);

	const c = colorClasses[type];

	// Use createPortal to render JSX content into the marker element
	return createPortal(
		<div className="relative w-8 h-8">
			<span className={`absolute inset-0 rounded-full ${c.glow} blur-sm`} />
			<span
				className={`absolute inset-0 rounded-full border-2 ${c.ripple} animate-ping`}
			/>
			<span
				className={`absolute inset-0 rounded-full border-2 ${c.ripple} animate-marker-ripple`}
			/>
			<span
				className={`absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${c.core} ring-2 ring-white shadow-md`}
			/>
		</div>,
		markerElementRef.current,
	);
};
