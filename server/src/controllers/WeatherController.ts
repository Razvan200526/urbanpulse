import { zValidator } from "@hono/zod-validator";
import { weatherService } from "@server/services/WeatherService";
import { weatherAlertsQuerySchema } from "@shared/validators/weather/isWeatherAlertsQueryValid";
import { Hono } from "hono";

export const weatherController = new Hono()
	.basePath("/weather")
	.get("/alerts", zValidator("query", weatherAlertsQuerySchema), async (c) => {
		const { lat, lon } = c.req.valid("query");
		const data = await weatherService.getAlerts(lat, lon);
		if (!data) {
			return c.json(
				{
					success: false,
					message: "Failed to fetch weather alerts",
					data: null,
				},
				502,
			);
		}

		return c.json({
			success: true,
			message: data.configured
				? "Weather alerts retrieved"
				: "Weather API not configured",
			data,
		});
	});
