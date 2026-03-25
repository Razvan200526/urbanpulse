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
	timeout: 10000,
	maximumAge: 60000,
};

export function useGetGeolocation(
	options: PositionOptions = GEO_OPTIONS,
	watch = false,
): GeolocationResult {
	const [coords, setCoords] = useState<GeolocationCoords | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	// Tracks whether the component is still mounted — prevents setState on unmounted component
	const mountedRef = useRef(true);
	// Stores the watchPosition ID so we can clear it on unmount
	const watchIdRef = useRef<number | null>(null);

	const geoLocation = useCallback(() => {
		if (!("geolocation" in navigator)) {
			setError("Geolocation is not supported by your browser");
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		const onSuccess = (position: GeolocationPosition) => {
			if (!mountedRef.current) return;
			setCoords({
				lat: position.coords.latitude,
				long: position.coords.longitude,
			});
			setIsLoading(false);
		};

		const onError = (err: GeolocationPositionError) => {
			if (!mountedRef.current) return;
			setError(err.message || "Unable to retrieve location");
			setIsLoading(false);
		};

		// Always do a one-shot fetch first for an immediate result
		navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

		// If live tracking is enabled, set up watchPosition and store the ID via ref
		if (watch) {
			// Clear any existing watcher before starting a new one
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
			}
			watchIdRef.current = navigator.geolocation.watchPosition(
				onSuccess,
				onError,
				options,
			);
		}
	}, [options, watch]);

	useEffect(() => {
		mountedRef.current = true;
		geoLocation();

		return () => {
			// Mark as unmounted so in-flight callbacks are ignored
			mountedRef.current = false;
			// Clean up the position watcher if one is active
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
				watchIdRef.current = null;
			}
		};
	}, [geoLocation]);

	return { coords, isError: error, isLoading, refresh: geoLocation };
}
