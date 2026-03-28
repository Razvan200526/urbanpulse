import { hono } from "@client/main";
import { useQuery } from "@tanstack/react-query";

export type WeatherAlertItem = {
	event?: string;
	description?: string;
	start?: number;
	end?: number;
	tags?: string[];
	sender_name?: string;
	severe: boolean;
};

export type WeatherAlertsData = {
	configured: boolean;
	alerts: WeatherAlertItem[];
	severe: boolean;
};

export function useWeatherAlerts(
	lat: number | undefined,
	lon: number | undefined,
) {
	return useQuery({
		queryKey: ["weather", "alerts", lat, lon],
		enabled: lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon),
		queryFn: async () => {
			const res = await hono.api.weather.alerts.$get({
				query: { lat: String(lat), lon: String(lon) },
			});
			const json = (await res.json()) as {
				success: boolean;
				message?: string;
				data: WeatherAlertsData | null;
			};
			if (!json.success || !json.data) {
				throw new Error(json.message || "Weather request failed");
			}
			return json.data;
		},
		staleTime: 5 * 60_000,
	});
}
