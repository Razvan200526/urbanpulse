import { useMap } from "@client/components/map/MapContext";
import type { SafetyCheckinView } from "@client/hooks/useSafetyCheckins";
import { SafetyCheckinStatusEnum } from "@shared/types";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

const statusStyleMap: Record<
	SafetyCheckinStatusEnum,
	{ color: string; label: string }
> = {
	[SafetyCheckinStatusEnum.Safe]: { color: "#22c55e", label: "I'm Safe" },
	[SafetyCheckinStatusEnum.NeedHelp]: {
		color: "#ef4444",
		label: "Need Help",
	},
	[SafetyCheckinStatusEnum.Injured]: { color: "#f97316", label: "Injured" },
	[SafetyCheckinStatusEnum.AvailableToHelp]: {
		color: "#3b82f6",
		label: "Available to Help",
	},
};

export const SafetyCheckinMarkers = ({
	checkins,
}: {
	checkins: SafetyCheckinView[];
}) => {
	const map = useMap();
	const markersRef = useRef<mapboxgl.Marker[]>([]);

	useEffect(() => {
		if (!map?.getStyle()) {
			return;
		}

		for (const marker of markersRef.current) {
			marker.remove();
		}
		markersRef.current = [];

		for (const checkin of checkins) {
			const dot = document.createElement("div");
			const style = statusStyleMap[checkin.status];
			dot.className =
				"rounded-full border-2 border-white shadow-sm transition-transform";
			dot.style.width = checkin.isMe ? "16px" : "12px";
			dot.style.height = checkin.isMe ? "16px" : "12px";
			dot.style.backgroundColor = style.color;
			dot.style.cursor = "pointer";

			const marker = new mapboxgl.Marker(dot)
				.setLngLat([checkin.lng, checkin.lat])
				.setPopup(
					new mapboxgl.Popup({ offset: 12 }).setHTML(
						`<div style="font-size:12px;line-height:1.4;"><strong>${checkin.userName}</strong><br/>${style.label}${checkin.isMe ? " (you)" : ""}</div>`,
					),
				)
				.addTo(map);

			markersRef.current.push(marker);
		}

		return () => {
			for (const marker of markersRef.current) {
				marker.remove();
			}
			markersRef.current = [];
		};
	}, [checkins, map]);

	return null;
};
