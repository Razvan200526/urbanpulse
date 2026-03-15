import { useCallback, useEffect, useState } from "react";

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

export function useGetGeolocation(): GeolocationResult {
	const [coords, setCoords] = useState<GeolocationCoords | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const geoLocation = useCallback(() => {
		if (!("geolocation" in navigator)) {
			setError("Geolocation is not supported by your browser");
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		navigator.geolocation.getCurrentPosition(
			(position) => {
				setCoords({
					lat: position.coords.latitude,
					long: position.coords.longitude,
				});
				setIsLoading(false);
			},
			(err: any) => {
				setError(err?.message || "Unable to retrieve location");
				setIsLoading(false);
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 60000,
			},
		);
	}, []);

	useEffect(() => {
		geoLocation();
	}, [geoLocation]);

	return { coords, isError: error, isLoading, refresh: geoLocation };
}
