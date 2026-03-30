import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapContext } from "./MapContext";

export interface MapProps {
	children?: React.ReactNode;
	center?: [number, number];
	zoom?: number;
	className?: string;
	style?: React.CSSProperties;
}

export const MapComponent = ({
	children,
	center = [0, 0],
	zoom = 9,
	className = "w-full h-full relative",
	style,
}: MapProps) => {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
	const hasInitialized = useRef(false);

	useEffect(() => {
		const token = import.meta.env.VITE_MAPBOX_GL_ACCESS_TOKEN as string;

		if (!token) {
			return;
		}

		if (!mapContainerRef.current || hasInitialized.current) return;
		hasInitialized.current = true;

		mapboxgl.accessToken = token;

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: "mapbox://styles/mapbox/dark-v11",
			center,
			zoom,
		});

		map.on("load", () => {
			setMapInstance(map);
			map.resize();
		});

		map.on("error", () => {
			return;
		});

		return () => {
			map.remove();
			setMapInstance(null);
			hasInitialized.current = false;
		};
	}, [center, zoom]);

	const centerLng = center[0];
	const centerLat = center[1];

	useEffect(() => {
		if (!mapInstance) return;

		mapInstance.flyTo({
			center: [centerLng, centerLat],
			zoom,
			essential: true,
		});
	}, [centerLng, centerLat, zoom, mapInstance]);

	return (
		<div ref={mapContainerRef} className={className} style={style}>
			{mapInstance && (
				<MapContext.Provider value={mapInstance}>
					{children}
				</MapContext.Provider>
			)}
		</div>
	);
};
