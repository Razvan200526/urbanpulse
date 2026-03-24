import { logger } from "@server/utils/Logger";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { pulseService } from "@server/services/PulseService";
import { handleError } from "@server/utils/handleError";

export const pulseController = new Hono()
	.basePath("/ws")
	.get(
		"/",
		upgradeWebSocket(async (_c) => {
			return {
				onMessage: async (event, ws) => {
					try {
						const reqData = JSON.parse(event.data.toString());
						const pulseData = reqData?.data;

						if (!pulseData) {
							ws.send(
								JSON.stringify({
									success: false,
									message: "Invalid pulse data",
								}),
							);
							return;
						}

						logger.info("Creating pulse");
						const { lat, lng } = pulseData.position;
						logger.info(`lat : ${lat} , long : ${lng}`);
						const newPulse = await pulseService.createPulse({
							urgency: pulseData.urgency,
							title: pulseData.title,
							description: pulseData.description,
							position: { x: lng, y: lat }, // x: longitude, y: latitude
							type: pulseData.type,
							userId: pulseData.userId,
							isResolved: false,
						});

						if (!newPulse) {
							ws.send(
								JSON.stringify({
									success: false,
									message: "Failed to create pulse",
								}),
							);
							return;
						}

						ws.send(
							JSON.stringify({
								success: true,
								message: "Pulse created",
								data: newPulse,
							}),
						);
					} catch (err) {
						logger.error("Failed to parse WebSocket message or create pulse");
						ws.send(
							JSON.stringify({ success: false, message: "Invalid request" }),
						);
					}
				},
				onClose: () => {
					logger.info("WebSocket closed");
				},
			};
		}),
	)
	.get(
		"/:userId",
		upgradeWebSocket((c) => {
			const userId = c.req.param("userId");
			return {
				onMessage: async (event, ws) => {
					try {
						const reqData = JSON.parse(event.data.toString());
						const coords = reqData?.data?.coords;

						if (!coords) {
							ws.send(
								JSON.stringify({
									success: false,
									message: "Invalid coordinates provided",
								}),
							);
							return;
						}

						const pulses = await pulseService.getPulses({
							userId: userId || "",
							coords: { lat: coords.lat, lng: coords.lng },
						});

						ws.send(
							JSON.stringify({
								success: true,
								data: pulses,
							}),
						);
					} catch (error) {
						handleError(error);
					}
				},
			};
		}),
	);
