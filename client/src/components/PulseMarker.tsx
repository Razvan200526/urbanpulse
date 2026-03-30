import { PulseDrawer } from "@client/pages/map/components/PulseDrawer";
import type { PulseType } from "@server/db/schema";
import { PulseEnum } from "@shared/types";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "./map/MapContext";

const colorClasses: Record<
	PulseEnum,
	{ core: string; ripple: string; glow: string }
> = {
	[PulseEnum.Emergency]: {
		core: "bg-red-500",
		ripple: "border-red-400/70",
		glow: "bg-red-400/35",
	},
	[PulseEnum.Skill]: {
		core: "bg-blue-500",
		ripple: "border-blue-400/70",
		glow: "bg-blue-400/35",
	},
	[PulseEnum.Item]: {
		core: "bg-green-500",
		ripple: "border-green-400/70",
		glow: "bg-green-400/35",
	},
};

export const PulseMarker = ({ pulse }: { pulse: PulseType }) => {
	const map = useMap();
	const markerRef = useRef<mapboxgl.Marker | null>(null);
	const el = useRef(document.createElement("div"));
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

		const addMarker = () => {
			markerRef.current = new mapboxgl.Marker({
				element: el.current,
			})
				.setLngLat([pulse.position.x, pulse.position.y])
				.addTo(map);
		};

		if (map.loaded()) {
			addMarker();
		} else {
			map.once("idle", addMarker);
		}

		return () => {
			markerEl.removeEventListener("click", handleClick);
			map.off("idle", addMarker);
			if (markerRef.current) {
				markerRef.current.remove();
				markerRef.current = null;
			}
		};
	}, [map, pulse]);

	const c = colorClasses[pulse.type];

	return (
		<>
			{createPortal(
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
				el.current,
			)}
			<PulseDrawer
				isOpen={isDrawerOpen}
				onOpenChange={setIsDrawerOpen}
				pulse={pulse}
			/>
		</>
	);
};
