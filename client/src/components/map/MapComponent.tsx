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
	fallback?: React.ReactNode;
	onUnavailableChange?: (isUnavailable: boolean) => void;
}

export const MapComponent = ({
	children,
	center = [0, 0],
	zoom = 9,
	className = "w-full h-full relative",
	style,
	fallback,
	onUnavailableChange,
}: MapProps) => {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
	const [isUnavailable, setIsUnavailable] = useState(false);
	const hasInitialized = useRef(false);

	useEffect(() => {
		const token = import.meta.env.VITE_MAPBOX_GL_ACCESS_TOKEN as string;

		if (!token) {
			setIsUnavailable(true);
			onUnavailableChange?.(true);
			return;
		}

		if (!mapContainerRef.current || hasInitialized.current) return;
		hasInitialized.current = true;
		setIsUnavailable(false);
		onUnavailableChange?.(false);

		mapboxgl.accessToken = token;
		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: "mapbox://styles/mapbox/dark-v11",
			center,
			zoom,
		});

		map.on("load", () => {
			setIsUnavailable(false);
			onUnavailableChange?.(false);
			setMapInstance(map);
			map.resize();
		});

		map.on("error", () => {
			setIsUnavailable(true);
			onUnavailableChange?.(true);
		});

		return () => {
			map.remove();
			setMapInstance(null);
			hasInitialized.current = false;
		};
	}, [center, onUnavailableChange, zoom]);

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
			{isUnavailable &&
				(fallback ?? (
					<div className="flex h-full items-center justify-center bg-surface-secondary/60 p-6 text-center text-sm text-muted">
						Map view is temporarily unavailable.
					</div>
				))}
			{mapInstance && (
				<MapContext.Provider value={mapInstance}>
					{children}
				</MapContext.Provider>
			)}
		</div>
	);
};
