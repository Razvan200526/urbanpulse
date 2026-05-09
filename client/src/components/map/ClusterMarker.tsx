import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import { useMap } from "./MapContext";
import {
	AlertCircle,
	Zap,
	Package,
	PawPrint,
	AlertTriangle,
} from "lucide-react";
import { PulseEnum } from "@shared/types";

interface ClusterMarkerProps {
	id: string;
	lat: number;
	lng: number;
	type: string;
	confidence: number | null;
	reportCount: number | null;
	isCrisis: boolean;
	onClick?: (clusterId: string) => void;
}

const typeIconConfig: Record<
	string,
	{ Icon: React.FC<{ className?: string }>; color: string }
> = {
	[PulseEnum.Emergency]: {
		Icon: AlertCircle,
		color: "bg-red-500",
	},
	[PulseEnum.Skill]: {
		Icon: Zap,
		color: "bg-blue-500",
	},
	[PulseEnum.Item]: {
		Icon: Package,
		color: "bg-green-500",
	},
	[PulseEnum.PetAlert]: {
		Icon: PawPrint,
		color: "bg-secondary",
	},
};

export const ClusterMarker = ({
	id,
	lat,
	lng,
	type,
	confidence,
	reportCount,
	isCrisis,
	onClick,
}: ClusterMarkerProps) => {
	const map = useMap();
	const markerRef = useRef<mapboxgl.Marker | null>(null);
	const el = useRef(document.createElement("div"));

	useEffect(() => {
		if (!map) return;

		const markerEl = el.current;
		markerEl.style.cursor = "pointer";
		markerEl.setAttribute("role", "button");
		markerEl.setAttribute("tabindex", "0");

		const config =
			typeIconConfig[type as PulseEnum] ||
			typeIconConfig[PulseEnum.Emergency];

		// Create marker HTML with cluster-specific styling
		const html = `
      <div class="relative flex items-center justify-center">
        <div class="absolute inset-0 ${config.color} rounded-full opacity-20 animate-pulse" style="width: 60px; height: 60px;"></div>
        ${
			isCrisis
				? `<div class="absolute inset-0 border-2 border-yellow-400 rounded-full animate-pulse" style="width: 60px; height: 60px;"></div>`
				: ""
		}
        <div class="relative w-12 h-12 ${config.color} rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4"/>
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
          </svg>
        </div>
        ${
			confidence !== null
				? `<div class="absolute top-0 right-0 bg-white rounded-full px-2 py-0.5 text-xs font-bold shadow-md" style="font-size: 10px;">
            ${Math.round(confidence)}%
          </div>`
				: ""
		}
        ${
			reportCount !== null
				? `<div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-2 py-0.5 text-xs font-bold shadow-md whitespace-nowrap">
            ${reportCount} reports
          </div>`
				: ""
		}
      </div>
    `;

		markerEl.innerHTML = html;

		const handleClick = () => {
			onClick?.(id);
		};

		markerEl.addEventListener("click", handleClick);

		const newMarker = new mapboxgl.Marker({ element: markerEl })
			.setLngLat([lng, lat])
			.addTo(map);

		markerRef.current = newMarker;

		return () => {
			markerEl.removeEventListener("click", handleClick);
			newMarker.remove();
		};
	}, [map, id, lat, lng, type, confidence, reportCount, isCrisis, onClick]);

	return null;
};
