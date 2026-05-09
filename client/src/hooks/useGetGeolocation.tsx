import { useCallback, useEffect, useRef, useState } from "react";

export type GeolocationCoords = {
	lat: number;
	long: number;
};

type GeolocationResult = {
	coords: GeolocationCoords | null;
	isError: string | null;
	isLoading: boolean;
	refresh: () => void;
};

const GEO_OPTIONS: PositionOptions = {
	enableHighAccuracy: true,
	timeout: 15000,
	maximumAge: 300000,
};

export function useGetGeolocation(
	options: PositionOptions = GEO_OPTIONS,
	watch = false,
): GeolocationResult {
	const [coords, setCoords] = useState<GeolocationCoords | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const mountedRef = useRef(true);
	const watchIdRef = useRef<number | null>(null);

	const { enableHighAccuracy, timeout, maximumAge } = options;

	const geoLocation = useCallback(() => {
		if (typeof window !== "undefined" && !window.isSecureContext) {
			setError(
				"Geolocation requires a secure connection (HTTPS or localhost). Please check your URL.",
			);
			setIsLoading(false);
			return;
		}

		if (!("geolocation" in navigator)) {
			setError("Geolocation is not supported by your browser.");
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		const onSuccess = (position: GeolocationPosition) => {
			if (!mountedRef.current) return;
			// biome-ignore lint/suspicious/noConsole: essential for debugging browser-specific location issues
			console.log("Geolocation success:", position.coords);
			setCoords({
				lat: position.coords.latitude,
				long: position.coords.longitude,
			});
			setIsLoading(false);
		};

		const onError = (err: GeolocationPositionError) => {
			if (!mountedRef.current) return;
			// biome-ignore lint/suspicious/noConsole: essential for debugging browser-specific location issues
			console.error("Geolocation error:", err.code, err.message);

			let message = err.message || "Unable to retrieve location";
			if (err.code === 1) {
				message =
					"Location access denied. Please check your browser/system permissions and ensure you're using HTTPS.";
			} else if (err.code === 3) {
				message =
					"Location request timed out. Try moving to a spot with better signal or refreshing.";
			}

			setError(message);
			setIsLoading(false);
		};

		if (watch) {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
			}
			watchIdRef.current = navigator.geolocation.watchPosition(
				onSuccess,
				onError,
				{ enableHighAccuracy, timeout, maximumAge },
			);
		} else {
			navigator.geolocation.getCurrentPosition(onSuccess, onError, {
				enableHighAccuracy,
				timeout,
				maximumAge,
			});
		}
	}, [enableHighAccuracy, timeout, maximumAge, watch]);

	useEffect(() => {
		mountedRef.current = true;
		geoLocation();

		return () => {
			mountedRef.current = false;
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
				watchIdRef.current = null;
			}
		};
	}, [geoLocation]);

	return { coords, isError: error, isLoading, refresh: geoLocation };
}
