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
	timeout: 100,
	maximumAge: 60000,
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
		navigator.geolocation.getCurrentPosition(onSuccess, onError);

		if (watch) {
			const currentOptions: PositionOptions = {
				enableHighAccuracy,
				timeout,
				maximumAge,
			};
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
			}
			watchIdRef.current = navigator.geolocation.watchPosition(
				onSuccess,
				onError,
				currentOptions,
			);
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
