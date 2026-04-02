import { logger } from "@server/utils/Logger";
import { handleError } from "@server/utils/handleError";

/**
 * Open-Meteo `current` payload shape for the selected variables.
 */
type OpenMeteoCurrent = {
	time: string;
	interval: number;
	weather_code: number;
	temperature_2m: number;
	apparent_temperature: number;
	wind_speed_10m: number;
	wind_gusts_10m: number;
	precipitation: number;
};

/**
 * Open-Meteo `hourly` payload shape for the selected variables.
 */
type OpenMeteoHourly = {
	time: string[];
	weather_code: number[];
	apparent_temperature: number[];
	wind_speed_10m: number[];
	wind_gusts_10m: number[];
	precipitation_probability: number[];
};

/**
 * Open-Meteo unit metadata for current variables.
 */
type OpenMeteoCurrentUnits = {
	time: "iso8601";
	interval: "seconds";
	weather_code: "wmo code";
	temperature_2m: "°C";
	apparent_temperature: "°C";
	wind_speed_10m: "km/h";
	wind_gusts_10m: "km/h";
	precipitation: "mm";
};

/**
 * Open-Meteo unit metadata for hourly variables.
 */
type OpenMeteoHourlyUnits = {
	time: "iso8601";
	weather_code: "wmo code";
	apparent_temperature: "°C";
	wind_speed_10m: "km/h";
	wind_gusts_10m: "km/h";
	precipitation_probability: "%";
};

/**
 * Exact top-level response envelope from Open-Meteo forecast API.
 */
type OpenMeteoForecastResponse = {
	latitude: number;
	longitude: number;
	generationtime_ms: number;
	utc_offset_seconds: number;
	timezone: string;
	timezone_abbreviation: string;
	elevation: number;
	current_units: OpenMeteoCurrentUnits;
	current: OpenMeteoCurrent;
	hourly_units: OpenMeteoHourlyUnits;
	hourly: OpenMeteoHourly;
};

/**
 * Internal severity bucket used while scoring weather signals.
 */
type AlertSeverity = "advisory" | "severe";

/**
 * Internal input used to build normalized weather alerts.
 */
type DerivedAlertInput = {
	event?: string;
	description?: string;
	start?: number;
	end?: number;
	tags?: string[];
	sender_name?: string;
	severity: AlertSeverity;
};

/**
 * Weather alert item returned to the frontend.
 */
export type WeatherAlert = {
	event?: string;
	description?: string;
	start?: number;
	end?: number;
	tags?: string[];
	sender_name?: string;
	severe: boolean;
};

/**
 * Weather alert response payload returned by the weather service.
 */
export type WeatherAlertsResult = {
	configured: boolean;
	alerts: WeatherAlert[];
	severe: boolean;
};

/**
 * Produces severe-weather heuristics from Open-Meteo free forecast data.
 *
 * Notes:
 * - Open-Meteo does not provide first-party government alert objects here.
 * - We derive risk signals from WMO weather codes, wind gusts,
 *   apparent temperature and precipitation probability.
 */
export class WeatherService {
	private readonly serviceName = "UrbanPulse Weather Heuristic (Open-Meteo)";

	/** WMO weather codes treated as severe by default. */
	private readonly severeWeatherCodes = new Set<number>([
		65, 67, 75, 82, 86, 95, 96, 99,
	]);

	/** WMO weather codes treated as advisory by default. */
	private readonly advisoryWeatherCodes = new Set<number>([
		56, 57, 61, 63, 66, 71, 73, 77, 80, 81, 85,
	]);

	/**
	 * Creates a normalized alert object from derived signals.
	 */
	private toAlert(input: DerivedAlertInput): WeatherAlert {
		return {
			event: input.event,
			description: input.description,
			start: input.start,
			end: input.end,
			tags: input.tags,
			sender_name: input.sender_name ?? this.serviceName,
			severe: input.severity === "severe",
		};
	}

	/**
	 * Maps WMO weather code to a readable label.
	 */
	private weatherCodeLabel(code: number): string {
		const labels: Record<number, string> = {
			0: "Clear sky",
			1: "Mainly clear",
			2: "Partly cloudy",
			3: "Overcast",
			45: "Fog",
			48: "Depositing rime fog",
			51: "Light drizzle",
			53: "Moderate drizzle",
			55: "Dense drizzle",
			56: "Freezing drizzle",
			57: "Dense freezing drizzle",
			61: "Slight rain",
			63: "Moderate rain",
			65: "Heavy rain",
			66: "Freezing rain",
			67: "Heavy freezing rain",
			71: "Slight snowfall",
			73: "Moderate snowfall",
			75: "Heavy snowfall",
			77: "Snow grains",
			80: "Rain showers",
			81: "Heavy rain showers",
			82: "Violent rain showers",
			85: "Snow showers",
			86: "Heavy snow showers",
			95: "Thunderstorm",
			96: "Thunderstorm with hail",
			99: "Severe thunderstorm with hail",
		};
		return labels[code] || `Weather code ${code}`;
	}

	/**
	 * Converts a weather code into a severity bucket.
	 */
	private severityFromWeatherCode(
		code: number | undefined,
	): AlertSeverity | null {
		if (code == null) return null;
		if (this.severeWeatherCodes.has(code)) return "severe";
		if (this.advisoryWeatherCodes.has(code)) return "advisory";
		return null;
	}

	/**
	 * Converts wind gust speed in km/h into a severity bucket.
	 */
	private severityFromWindGust(
		gustKmh: number | undefined,
	): AlertSeverity | null {
		if (gustKmh == null) return null;
		if (gustKmh >= 75) return "severe";
		if (gustKmh >= 50) return "advisory";
		return null;
	}

	/**
	 * Converts apparent temperature in C into a severity bucket.
	 */
	private severityFromApparentTemperature(
		apparentC: number | undefined,
	): AlertSeverity | null {
		if (apparentC == null) return null;
		if (apparentC >= 40 || apparentC <= -15) return "severe";
		if (apparentC >= 35 || apparentC <= -10) return "advisory";
		return null;
	}

	/**
	 * Converts precipitation probability (%) into a severity bucket.
	 *
	 * We only treat very high probability as severe when weather-code risk
	 * is also present, to avoid noisy severe alerts from rain chance alone.
	 */
	private severityFromPrecipProbability(
		precipProbability: number | undefined,
		codeSeverity: AlertSeverity | null,
	): AlertSeverity | null {
		if (precipProbability == null) return null;
		if (precipProbability >= 90 && codeSeverity) return "severe";
		if (precipProbability >= 80) return "advisory";
		return null;
	}

	/**
	 * Converts current precipitation (mm in interval) into a severity bucket.
	 */
	private severityFromCurrentPrecip(
		precipMm: number | undefined,
	): AlertSeverity | null {
		if (precipMm == null) return null;
		if (precipMm >= 20) return "severe";
		if (precipMm >= 8) return "advisory";
		return null;
	}

	/**
	 * Resolves the highest severity from a list of signal severities.
	 */
	private combineSeverity(
		severities: Array<AlertSeverity | null>,
	): AlertSeverity | null {
		if (severities.includes("severe")) return "severe";
		if (severities.includes("advisory")) return "advisory";
		return null;
	}

	/**
	 * Converts ISO date-time strings into Unix seconds.
	 */
	private toUnixSeconds(value: string | undefined): number | undefined {
		if (!value) return undefined;
		const ms = Date.parse(value);
		if (Number.isNaN(ms)) return undefined;
		return Math.floor(ms / 1000);
	}

	/**
	 * Derives at most one current-conditions alert.
	 */
	private deriveCurrentConditionAlerts(
		current: OpenMeteoCurrent,
	): WeatherAlert[] {
		const start = this.toUnixSeconds(current.time);
		const end = start ? start + Math.max(current.interval, 900) : undefined;

		const codeSeverity = this.severityFromWeatherCode(current.weather_code);
		const windSeverity = this.severityFromWindGust(current.wind_gusts_10m);
		const tempSeverity = this.severityFromApparentTemperature(
			current.apparent_temperature,
		);
		const precipSeverity = this.severityFromCurrentPrecip(
			current.precipitation,
		);

		const severity = this.combineSeverity([
			codeSeverity,
			windSeverity,
			tempSeverity,
			precipSeverity,
		]);

		if (!severity) return [];

		const tags = [
			"derived",
			"source:open-meteo",
			"category:current",
			`severity:${severity}`,
			codeSeverity ? "signal:wmo-code" : null,
			windSeverity ? "signal:gust" : null,
			tempSeverity ? "signal:apparent-temperature" : null,
			precipSeverity ? "signal:precipitation" : null,
		].filter(Boolean) as string[];

		const event =
			severity === "severe" ? "Severe weather conditions" : "Weather advisory";
		const codeText = this.weatherCodeLabel(current.weather_code);
		const description = `${codeText}. Wind gusts ${Math.round(
			current.wind_gusts_10m,
		)} km/h. Feels like ${Math.round(current.apparent_temperature)} C.`;

		return [
			this.toAlert({
				event,
				description,
				start,
				end,
				tags,
				severity,
			}),
		];
	}

	/**
	 * Derives a forecast alert from the next 24 hourly points.
	 *
	 * Strategy:
	 * - Return the earliest severe signal if found.
	 * - Otherwise return the earliest advisory signal.
	 */
	private deriveForecastAlerts(hourly: OpenMeteoHourly): WeatherAlert[] {
		if (!hourly.time.length) return [];

		const horizon = Math.min(hourly.time.length, 24);
		let advisoryCandidate: WeatherAlert | null = null;

		for (let i = 0; i < horizon; i++) {
			const code = hourly.weather_code[i];
			const gust = hourly.wind_gusts_10m[i] ?? hourly.wind_speed_10m[i];
			const precipProbability = hourly.precipitation_probability[i];
			const apparentTemp = hourly.apparent_temperature[i];

			const codeSeverity = this.severityFromWeatherCode(code);
			const windSeverity = this.severityFromWindGust(gust);
			const tempSeverity = this.severityFromApparentTemperature(apparentTemp);
			const precipSeverity = this.severityFromPrecipProbability(
				precipProbability,
				codeSeverity,
			);

			const severity = this.combineSeverity([
				codeSeverity,
				windSeverity,
				tempSeverity,
				precipSeverity,
			]);
			if (!severity) continue;

			const start = this.toUnixSeconds(hourly.time[i]);
			const event =
				severity === "severe"
					? "Dangerous weather forecast"
					: "Weather advisory forecast";
			const codeText =
				code != null ? this.weatherCodeLabel(code) : "Unknown conditions";
			const description = `${codeText}. Precipitation probability ${Math.round(
				precipProbability ?? 0,
			)}%. Wind gusts ${Math.round(gust ?? 0)} km/h.`;

			const tags = [
				"derived",
				"source:open-meteo",
				"category:forecast",
				`severity:${severity}`,
				codeSeverity ? "signal:wmo-code" : null,
				windSeverity ? "signal:gust" : null,
				tempSeverity ? "signal:apparent-temperature" : null,
				precipSeverity ? "signal:precipitation-probability" : null,
			].filter(Boolean) as string[];

			const alert = this.toAlert({
				event,
				description,
				start,
				end: start ? start + 3600 : undefined,
				tags,
				severity,
			});

			if (severity === "severe") return [alert];
			if (!advisoryCandidate) advisoryCandidate = alert;
		}

		return advisoryCandidate ? [advisoryCandidate] : [];
	}

	/**
	 * Removes duplicate alerts by event+start marker.
	 */
	private dedupeAlerts(alerts: WeatherAlert[]): WeatherAlert[] {
		const seen = new Set<string>();
		return alerts.filter((alert) => {
			const key = `${alert.event || ""}:${alert.start || 0}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}

	/**
	 * Fetches Open-Meteo forecast data for current and hourly signals.
	 */
	private async fetchForecast(
		lat: number,
		lon: number,
	): Promise<OpenMeteoForecastResponse | null> {
		const url = new URL("https://api.open-meteo.com/v1/forecast");
		url.searchParams.set("latitude", String(lat));
		url.searchParams.set("longitude", String(lon));
		url.searchParams.set(
			"current",
			"weather_code,temperature_2m,apparent_temperature,wind_speed_10m,wind_gusts_10m,precipitation",
		);
		url.searchParams.set(
			"hourly",
			"weather_code,apparent_temperature,wind_speed_10m,wind_gusts_10m,precipitation_probability",
		);
		url.searchParams.set("forecast_hours", "24");
		url.searchParams.set("timezone", "UTC");

		const res = await fetch(url.toString());
		if (!res.ok) {
			logger.error(`Open-Meteo API error: ${res.status} ${await res.text()}`);
			return null;
		}

		return (await res.json()) as OpenMeteoForecastResponse;
	}

	/**
	 * Returns normalized weather alerts derived from Open-Meteo forecast data.
	 */
	async getAlerts(
		lat: number,
		lon: number,
	): Promise<WeatherAlertsResult | null> {
		try {
			const forecast = await this.fetchForecast(lat, lon);
			if (!forecast) return null;

			const alerts = this.dedupeAlerts([
				...this.deriveCurrentConditionAlerts(forecast.current),
				...this.deriveForecastAlerts(forecast.hourly),
			]);

			return {
				configured: true,
				alerts,
				severe: alerts.some((alert) => alert.severe),
			};
		} catch (error) {
			handleError(error);
			return null;
		}
	}
}

export const weatherService = new WeatherService();
