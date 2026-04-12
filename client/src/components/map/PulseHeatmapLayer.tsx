import type { ClientPulseType } from "@client/utils/types";
import { PulseEnum, UrgencyEnum } from "@shared/types";
import type { GeoJSONSource } from "mapbox-gl";
import { useEffect, useRef } from "react";
import { useMap } from "./MapContext";

const SOURCE_ID = "urbanpulse-pulses-density";
const HEAT_LAYER_ID = "urbanpulse-pulses-heatmap";

function heatWeight(p: ClientPulseType): number {
	if (p.type === PulseEnum.Emergency) return 4;
	if (p.urgency === UrgencyEnum.Immediate) return 3;
	if (p.urgency === UrgencyEnum.Urgent) return 2;
	return 1;
}

function toFeatureCollection(pulses: ClientPulseType[]) {
	return {
		type: "FeatureCollection" as const,
		features: pulses.map((p) => ({
			type: "Feature" as const,
			properties: { weight: heatWeight(p) },
			geometry: {
				type: "Point" as const,
				coordinates: [p.position.x, p.position.y] as [number, number],
			},
		})),
	};
}

export function PulseHeatmapLayer({ pulses }: { pulses: ClientPulseType[] }) {
	const map = useMap();
	const pulsesRef = useRef(pulses);
	pulsesRef.current = pulses;

	useEffect(() => {
		if (!map) return;

		const onStyleReady = () => {
			if (!map.isStyleLoaded()) return;
			const fc = toFeatureCollection(pulsesRef.current);
			if (!map.getSource(SOURCE_ID)) {
				map.addSource(SOURCE_ID, { type: "geojson", data: fc });
				map.addLayer({
					id: HEAT_LAYER_ID,
					type: "heatmap",
					source: SOURCE_ID,
					paint: {
						"heatmap-weight": [
							"interpolate",
							["linear"],
							["get", "weight"],
							0,
							0,
							4,
							1,
						],
						"heatmap-intensity": [
							"interpolate",
							["linear"],
							["zoom"],
							11,
							0.4,
							17,
							1.8,
						],
						"heatmap-color": [
							"interpolate",
							["linear"],
							["heatmap-density"],
							0,
							"rgba(59,130,246,0)",
							0.25,
							"rgba(96,165,250,0.45)",
							0.55,
							"rgba(251,191,36,0.55)",
							0.85,
							"rgba(248,113,113,0.75)",
							1,
							"rgba(220,38,38,0.9)",
						],
						"heatmap-radius": [
							"interpolate",
							["linear"],
							["zoom"],
							11,
							10,
							17,
							32,
						],
						"heatmap-opacity": 0.75,
					},
				});
			} else {
				(map.getSource(SOURCE_ID) as GeoJSONSource).setData(
					fc as GeoJSON.FeatureCollection,
				);
			}
		};

		if (map.isStyleLoaded()) onStyleReady();
		else map.once("load", onStyleReady);

		return () => {
			map.off("load", onStyleReady);
		};
	}, [map]);
	useEffect(() => {
		if (!map) return;

		const onStyleData = () => {
			if (!map.isStyleLoaded()) return;

			const fc = toFeatureCollection(pulsesRef.current);

			if (!map.getSource(SOURCE_ID)) {
				map.addSource(SOURCE_ID, { type: "geojson", data: fc });
				map.addLayer({
					id: HEAT_LAYER_ID,
					type: "heatmap",
					source: SOURCE_ID,
					paint: {
						/* ... */
					},
				});
			}
		};

		map.on("styledata", onStyleData);

		return () => {
			map.off("styledata", onStyleData);
		};
	}, [map]);

	useEffect(() => {
		if (!map?.isStyleLoaded()) return;

		const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
		if (!source) return;

		const fc = toFeatureCollection(pulses);
		source.setData(fc as GeoJSON.FeatureCollection);
	}, [map, pulses]);

	useEffect(() => {
		if (!map) return;

		return () => {
			if (!map.isStyleLoaded()) return;

			try {
				if (map.getLayer(HEAT_LAYER_ID)) map.removeLayer(HEAT_LAYER_ID);
				if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
			} catch {}
		};
	}, [map]);

	return null;
}
