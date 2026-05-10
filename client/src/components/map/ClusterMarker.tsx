import { ClusterDrawer } from "@client/pages/map/components/ClusterDrawer";
import type { ClientClusterType } from "@client/utils/clusterTypes";
import { useCrisisStore } from "@client/stores/crisisStore";
import { PulseEnum } from "@shared/types";
import { GLOBAL_CRISIS_RADIUS_THRESHOLD_METERS } from "@shared/utils/crisis";
import { AlertCircle, Package, PawPrint, Zap } from "lucide-react";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "./MapContext";

interface ClusterMarkerProps {
	cluster: ClientClusterType;
}

const typeIconConfig: Record<
	string,
	{
		Icon: React.FC<{ className?: string }>;
		color: string;
		fill: string;
		label: string;
	}
> = {
	[PulseEnum.Emergency]: {
		Icon: AlertCircle,
		color: "text-danger",
		fill: "#ef4444", // red-500
		label: "Emergency",
	},
	[PulseEnum.Skill]: {
		Icon: Zap,
		color: "text-accent",
		fill: "#7c3aed", // violet-600 (accent)
		label: "Skill",
	},
	[PulseEnum.Item]: {
		Icon: Package,
		color: "text-success",
		fill: "#10b981", // emerald-500
		label: "Item",
	},
	[PulseEnum.PetAlert]: {
		Icon: PawPrint,
		color: "text-secondary",
		fill: "#f59e0b", // amber-500
		label: "Pet Alert",
	},
};

const cityBoundaryCache = new Map<string, GeoJSON.FeatureCollection | null>();
const cityBoundaryInFlight = new Map<
	string,
	Promise<GeoJSON.FeatureCollection | null>
>();

const getCityBoundaryCacheKey = (lat: number, lng: number) =>
	`${lat.toFixed(3)},${lng.toFixed(3)}`;

const extractPolygonBoundary = (
	data: unknown,
): GeoJSON.FeatureCollection | null => {
	if (
		!data ||
		typeof data !== "object" ||
		(data as { type?: string }).type !== "FeatureCollection"
	) {
		return null;
	}

	const features = (data as { features?: unknown[] }).features;
	if (!Array.isArray(features)) {
		return null;
	}

	const polygonFeature = features.find((feature) => {
		const geometry = (feature as { geometry?: { type?: string } }).geometry;
		return geometry?.type === "Polygon" || geometry?.type === "MultiPolygon";
	});

	if (!polygonFeature) {
		return null;
	}

	return {
		type: "FeatureCollection",
		features: [polygonFeature as GeoJSON.Feature],
	};
};

const fetchCityBoundaryByCoordinates = async (
	lat: number,
	lng: number,
): Promise<GeoJSON.FeatureCollection | null> => {
	const cacheKey = getCityBoundaryCacheKey(lat, lng);
	const cached = cityBoundaryCache.get(cacheKey);
	if (cached !== undefined) {
		return cached;
	}

	const pending = cityBoundaryInFlight.get(cacheKey);
	if (pending) {
		return pending;
	}

	const request = (async () => {
		try {
			const url = new URL("https://nominatim.openstreetmap.org/reverse");
			url.searchParams.set("format", "geojson");
			url.searchParams.set("lat", String(lat));
			url.searchParams.set("lon", String(lng));
			url.searchParams.set("zoom", "10");
			url.searchParams.set("addressdetails", "1");
			url.searchParams.set("polygon_geojson", "1");
			url.searchParams.set("polygon_threshold", "0.001");

			const response = await fetch(url.toString(), {
				headers: {
					Accept: "application/geo+json, application/json",
				},
			});
			if (!response.ok) {
				cityBoundaryCache.set(cacheKey, null);
				return null;
			}

			const payload = (await response.json()) as unknown;
			const boundary = extractPolygonBoundary(payload);
			cityBoundaryCache.set(cacheKey, boundary);
			return boundary;
		} catch {
			cityBoundaryCache.set(cacheKey, null);
			return null;
		} finally {
			cityBoundaryInFlight.delete(cacheKey);
		}
	})();

	cityBoundaryInFlight.set(cacheKey, request);
	return request;
};

// Utility to create a GeoJSON circle
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
	const ret = [];
	const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
	const distanceY = km / 110.57;

	for (let i = 0; i < points; i++) {
		const theta = (i / points) * (2 * Math.PI);
		const x = distanceX * Math.cos(theta);
		const y = distanceY * Math.sin(theta);

		ret.push([coords.longitude + x, coords.latitude + y]);
	}
	ret.push(ret[0]);

	return {
		type: "Feature" as const,
		geometry: {
			type: "Polygon" as const,
			coordinates: [ret],
		},
		properties: {},
	};
};

export const ClusterMarker = ({ cluster }: ClusterMarkerProps) => {
	const {
		id,
		centerLat: lat,
		centerLng: lng,
		pulseType: type,
		confidenceScore: confidence,
		reportCount,
		radiusMeters,
		status,
	} = cluster;
	const isCrisis = status === "crisis";
	const isGlobalCrisis =
		isCrisis && radiusMeters >= GLOBAL_CRISIS_RADIUS_THRESHOLD_METERS;

	const { isCrisisModeActive } = useCrisisStore();
	const map = useMap();
	const markerRef = useRef<mapboxgl.Marker | null>(null);
	const el = useRef(document.createElement("div"));
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const sourceId = `cluster-${id}-source`;
	const layerId = `cluster-${id}-layer`;
	const borderLayerId = `cluster-${id}-border-layer`;

	const config =
		typeIconConfig[type as PulseEnum] || typeIconConfig[PulseEnum.Emergency];

	useEffect(() => {
		if (!map) return;

		const markerEl = el.current;
		markerEl.style.cursor = "pointer";
		markerEl.setAttribute("role", "button");
		markerEl.setAttribute("tabindex", "0");

		const handleClick = (e: MouseEvent) => {
			e.stopPropagation();
			setIsDrawerOpen(true);
		};

		markerEl.addEventListener("click", handleClick);
		let isDestroyed = false;

		let cleanupAnimation: (() => void) | undefined;

		const addMarkerAndRadius = async () => {
			if (!map) return;

			// Add Center Marker
			const newMarker = new mapboxgl.Marker({ element: markerEl })
				.setLngLat([lng, lat])
				.addTo(map);

			markerRef.current = newMarker;

			// Add Radius (or city boundary for global crisis) Source & Layers
			if (!map.getSource(sourceId)) {
				const cityBoundary = isGlobalCrisis
					? await fetchCityBoundaryByCoordinates(lat, lng)
					: null;
				if (isDestroyed || !map.getStyle() || map.getSource(sourceId)) {
					return;
				}

				map.addSource(sourceId, {
					type: "geojson",
					data: cityBoundary ?? createGeoJSONCircle([lng, lat], radiusMeters),
				});

				map.addLayer({
					id: layerId,
					type: "fill",
					source: sourceId,
					layout: {},
					paint: {
						"fill-color": config.fill,
						"fill-opacity": isGlobalCrisis ? 0.08 : isCrisis ? 0.2 : 0.1,
					},
				});

				map.addLayer({
					id: borderLayerId,
					type: "line",
					source: sourceId,
					layout: {},
					paint: {
						"line-color": config.fill,
						"line-width": isCrisis ? 3 : 1,
						"line-dasharray": isGlobalCrisis
							? [1.5, 1.5]
							: isCrisis
								? [1, 0]
								: [2, 2],
						"line-opacity": 0.5,
					},
				});

				// Pulse animation for crisis border
				if (isCrisis) {
					let opacity = 0.5;
					let direction = -0.01;
					let destroyed = false;

					const animate = () => {
						if (
							destroyed ||
							!map ||
							!map.getStyle() ||
							!map.getLayer(borderLayerId)
						)
							return;

						if (!isCrisisModeActive) {
							opacity += direction;
							if (opacity <= 0.1 || opacity >= 0.8) direction *= -1;
							map.setPaintProperty(borderLayerId, "line-opacity", opacity);
							requestAnimationFrame(animate);
						} else {
							// Just set static opacity and stop animating
							map.setPaintProperty(borderLayerId, "line-opacity", 0.5);
						}
					};
					animate();

					cleanupAnimation = () => {
						destroyed = true;
					};
				}
			}
		};

		if (map.loaded()) {
			addMarkerAndRadius();
		} else {
			map.once("idle", addMarkerAndRadius);
		}

		return () => {
			isDestroyed = true;
			markerEl.removeEventListener("click", handleClick);
			map.off("idle", addMarkerAndRadius);
			if (cleanupAnimation) cleanupAnimation();

			if (map?.getStyle()) {
				if (map.getLayer(layerId)) map.removeLayer(layerId);
				if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
				if (map.getSource(sourceId)) map.removeSource(sourceId);
			}

			if (markerRef.current) {
				markerRef.current.remove();
				markerRef.current = null;
			}
		};
	}, [
		map,
		lat,
		lng,
		radiusMeters,
		isCrisis,
		isGlobalCrisis,
		config.fill,
		sourceId,
		layerId,
		borderLayerId,
		isCrisisModeActive,
	]);
	const { Icon } = config;

	return (
		<>
			{createPortal(
				<div className="group relative flex flex-col items-center justify-center">
					{/* Ripples */}
					<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
						<div
							className={`absolute w-12 h-12 rounded-full border-2 border-current opacity-0 animate-marker-ripple ${config.color}`}
						/>
						<div
							className={`absolute w-12 h-12 rounded-full border-2 border-current opacity-0 animate-marker-ripple-delayed ${config.color}`}
						/>
						{isCrisis && (
							<div className="absolute w-16 h-16 rounded-full bg-warning opacity-10 animate-pulse" />
						)}
					</div>

					{/* Floating Label */}
					<div className="absolute bottom-full mb-3 transform transition-transform group-hover:-translate-y-1">
						<div className="flex items-center gap-1.5 px-3 py-1 bg-surface border border-accent rounded-full shadow-lg whitespace-nowrap">
							<span
								className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}
							>
								{config.label}
							</span>
							{reportCount !== null && (
								<span className="text-[10px] text-muted font-medium border-l border-border pl-1.5">
									{reportCount} reports
								</span>
							)}
						</div>
						{/* Pointer arrow for label */}
						<div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-surface border-r border-b border-accent rotate-45" />
					</div>

					{/* Main Marker Core */}
					<div
						className={`relative w-11 h-11 bg-surface rounded-full flex items-center justify-center shadow-xl border-2 transition-transform group-hover:scale-110 ${
							isCrisis ? "border-warning animate-bounce" : "border-accent"
						}`}
					>
						<Icon className={`w-5 h-5 ${config.color}`} />

						{/* Verification/Crisis Mini Badge */}
						{isCrisis ? (
							<div className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full border border-surface flex items-center justify-center shadow-sm">
								<AlertCircle className="w-2.5 h-2.5 text-warning-foreground" />
							</div>
						) : confidence && confidence > 80 ? (
							<div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border border-surface flex items-center justify-center shadow-sm">
								<div className="w-1.5 h-1.5 bg-success-foreground rounded-full" />
							</div>
						) : null}
					</div>
				</div>,
				el.current,
			)}
			<ClusterDrawer
				cluster={cluster}
				isOpen={isDrawerOpen}
				onOpenChange={setIsDrawerOpen}
			/>
		</>
	);
};
