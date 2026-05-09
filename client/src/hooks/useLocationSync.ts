import { backend } from "client/sdk/backend";
import { useEffect, useRef } from "react";
import type { GeolocationCoords } from "./useGetGeolocation";
import { useGetGeolocation } from "./useGetGeolocation";

const THROTTLE_MS = 30_000;
const GEO_SYNC_OPTIONS: PositionOptions = {
	enableHighAccuracy: true,
	timeout: 30000,
	maximumAge: 300000,
};

export const useLocationSync = () => {
	const { coords } = useGetGeolocation(GEO_SYNC_OPTIONS, true);
	const latestCoordsRef = useRef<GeolocationCoords | null>(null);
	const lastSyncRef = useRef<number>(0);

	useEffect(() => {
		const sendLocation = () => {
			if (!backend.notifications.isOpen || !latestCoordsRef.current) return;
			lastSyncRef.current = Date.now();
			backend.notifications.send({
				type: "UPDATE_LOCATION",
				location: {
					x: latestCoordsRef.current.long,
					y: latestCoordsRef.current.lat,
				},
			});
		};

		const unsubscribe = backend.notifications.on("open", sendLocation);
		return unsubscribe;
	}, []);

	useEffect(() => {
		latestCoordsRef.current = coords ?? null;

		if (!backend.notifications.isOpen || !coords) return;

		const now = Date.now();
		const elapsed = now - lastSyncRef.current;

		const sendLocation = () => {
			if (!backend.notifications.isOpen || !latestCoordsRef.current) return;
			lastSyncRef.current = Date.now();
			backend.notifications.send({
				type: "UPDATE_LOCATION",
				location: {
					x: latestCoordsRef.current.long,
					y: latestCoordsRef.current.lat,
				},
			});
		};

		if (elapsed >= THROTTLE_MS) {
			sendLocation();
			return;
		}

		const timerId = setTimeout(sendLocation, THROTTLE_MS - elapsed);
		return () => clearTimeout(timerId);
	}, [coords]);
};
