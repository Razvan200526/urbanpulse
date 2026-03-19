import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useGetGeolocation } from "@client/hooks/useGetGeolocation";
import { Toast } from "@heroui/react";
import { Loader } from "@client/components/Loader";

export const HomePage = () => {
	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<mapboxgl.Map | null>(null);

	const { coords, isError, isLoading } = useGetGeolocation();

	if (isError) {
		Toast.toast.danger("Failed to get geolocation");
	}

	useEffect(() => {
		if (map.current) return;
		if (!mapContainer.current) return;

		mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_GL_ACCESS_TOKEN || "";

		map.current = new mapboxgl.Map({
			container: mapContainer.current,
			style: "mapbox://styles/mapbox/dark-v11",
			center: [coords?.long || 0, coords?.lat || 0],
			zoom: 9,
		});

		return () => {
			map.current?.remove();
			map.current = null;
		};
	}, [coords]);

	if (isLoading) {
		return <Loader />;
	}
	return (
		<div className="w-full h-screen relative">
			<div ref={mapContainer} className="w-full h-full" />
		</div>
	);
};
