import { pulseService } from "@server/services/PulseService";
import { notificationService } from "@server/services/NotificationService";
import { handleError } from "@server/utils/handleError";
import { PulseUploadStateEnum } from "@shared/types";
import { pulseRequestSchema } from "@shared/validators/pulses/isPulseRequestValid";
import { retrievePulsePayloadSchema } from "@shared/validators/pulses/isPulseRetrieveValid";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";

export const pulseController = new Hono()
	.get(
		"/",
		upgradeWebSocket(async () => {
			return {
				onOpen: () => {
					console.log("WebSocket opened");
				},
				onMessage: async (event, ws) => {
					try {
						const data = JSON.parse(event.data.toString());
						const result = pulseRequestSchema.safeParse(data);
						if (!result.success) {
							ws.send(
								JSON.stringify({
									success: false,
									messaage: "Invalid request",
									data: null,
								}),
							);
							return;
						}
						const newPulse = await pulseService.createPulse(result.data);
						if (!newPulse) {
							ws.send(
								JSON.stringify({
									success: false,
									message: "Failed to create pulse",
									data: null,
								}),
							);
							return;
						}
						const uploadedPulse = await pulseService.updatePulse(newPulse.id, {
							pulseUploadState: PulseUploadStateEnum.Uploaded,
						});

						ws.send(
							JSON.stringify({
								success: true,
								message: "Pulse received",
								data: uploadedPulse,
							}),
						);

						if (uploadedPulse) {
							await notificationService.broadcastToNearbyUsers(uploadedPulse);
						}
					} catch (e) {
						handleError(e);
					}
				},
				onClose: () => {
					console.log("WebSocket closed");
				},
			};
		}),
	)

	.get(
		"/retrieve",
		upgradeWebSocket(async () => {
			return {
				onOpen: () => {
					console.log("Retrieve WebSocket opened");
				},
				onMessage: async (event, ws) => {
					const data = JSON.parse(event.data.toString());
					const result = retrievePulsePayloadSchema.safeParse(data);
					if (!result.success) {
						ws.send(
							JSON.stringify({
								success: false,
								message: "Invalid request",
								data: null,
							}),
						);
						return;
					}
					const pulses = await pulseService.getPulses({
						userId: result.data.userId,
						position: result.data.position,
					});
					ws.send(
						JSON.stringify({
							success: true,
							message: "Pulses retrieved",
							data: pulses,
						}),
					);
				},
				onClose: () => {
					console.log("Retrieve WebSocket closed");
				},
			};
		}),
	);
