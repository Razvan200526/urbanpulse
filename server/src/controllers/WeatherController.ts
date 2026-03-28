import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { logger } from "@server/utils/Logger";
import { weatherAlertsQuerySchema } from "@shared/validators/weather/isWeatherAlertsQueryValid";

type OwmAlert = {
	event?: string;
	description?: string;
	start?: number;
	end?: number;
	tags?: string[];
	sender_name?: string;
};

function isSevereWeatherAlert(alert: OwmAlert): boolean {
	const event = (alert.event || "").toLowerCase();
	const tags = (alert.tags || []).join(" ").toLowerCase();
	if (/(extreme|tornado|hurricane|typhoon|tsunami)/i.test(event)) return true;
	if (/(extreme|severe|tornado|hurricane)/i.test(tags)) return true;
	if (
		event.includes("warning") &&
		/(thunderstorm|flood|wind|winter|heat|cold|ice|snow|tornado|hurricane)/i.test(
			event,
		)
	) {
		return true;
	}
	return false;
}

export const weatherController = new Hono()
	.basePath("/weather")
	.get("/alerts", zValidator("query", weatherAlertsQuerySchema), async (c) => {
		const { lat, lon } = c.req.valid("query");
		const apiKey = Bun.env.OPENWEATHER_API_KEY;
		if (!apiKey) {
			return c.json({
				success: true,
				message: "Weather API not configured",
				data: {
					configured: false,
					alerts: [] as OwmAlert[],
					severe: false,
				},
			});
		}
		try {
			const url = new URL("https://api.openweathermap.org/data/3.0/onecall");
			url.searchParams.set("lat", String(lat));
			url.searchParams.set("lon", String(lon));
			url.searchParams.set("exclude", "minutely,hourly,daily");
			url.searchParams.set("appid", apiKey);
			const res = await fetch(url.toString());
			if (!res.ok) {
				logger.error(`OpenWeather API error: ${res.status} ${await res.text()}`);
				return c.json(
					{
						success: false,
						message: "Weather service unavailable",
						data: null,
					},
					502,
				);
			}
			const json = (await res.json()) as { alerts?: OwmAlert[] };
			const alerts = json.alerts ?? [];
			const severe = alerts.some(isSevereWeatherAlert);
			return c.json({
				success: true,
				message: "Weather alerts retrieved",
				data: {
					configured: true,
					alerts: alerts.map((a) => ({
						event: a.event,
						description: a.description,
						start: a.start,
						end: a.end,
						tags: a.tags,
						sender_name: a.sender_name,
						severe: isSevereWeatherAlert(a),
					})),
					severe,
				},
			});
		} catch (e) {
			logger.exception(
				e instanceof Error ? e : new Error(String(e)),
			);
			return c.json(
				{ success: false, message: "Failed to fetch weather alerts", data: null },
				502,
			);
		}
	});
