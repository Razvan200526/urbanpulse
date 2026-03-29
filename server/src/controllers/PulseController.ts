import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@server/middleware/authMiddleware";
import { responseRepository } from "@server/repositories/ResponseRepository";
import { userRepository } from "@server/repositories/UserRepository";
import auth from "@server/services/auth/AuthService";
import { notificationService } from "@server/services/NotificationService";
import { pulseService } from "@server/services/PulseService";
import { responseService } from "@server/services/ResponseService";
import { handleError } from "@server/utils/handleError";
import { PulseStatusEnum, PulseUploadStateEnum } from "@shared/types";
import { acceptHelpParamsSchema } from "@shared/validators/pulses/isAcceptHelpParamsValid";
import { offerHelpBodySchema } from "@shared/validators/pulses/isOfferHelpValid";
import { pulseRequestSchema } from "@shared/validators/pulses/isPulseRequestValid";
import { retrievePulsePayloadSchema } from "@shared/validators/pulses/isPulseRetrieveValid";
import {
	pulseIdParamSchema,
	pulseUpdateBodySchema,
} from "@shared/validators/pulses/isPulseUpdateValid";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";

export const pulseController = new Hono()
	.basePath("/pulse")
	.use(authMiddleware)
	.patch(
		"/:id",
		zValidator("param", pulseIdParamSchema),
		zValidator("json", pulseUpdateBodySchema),
		async (c) => {
			const { id } = c.req.valid("param");
			const body = c.req.valid("json");
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}
			const updated = await pulseService.updatePulseAsOwner(
				id,
				session.user.id,
				body,
			);
			if (!updated) {
				return c.json(
					{ success: false, message: "Pulse not found", data: null },
					404,
				);
			}
			notificationService.broadcastPulseUpdated(updated);
			return c.json({
				success: true,
				message: "Pulse updated",
				data: updated,
			});
		},
	)
	.post(
		"/:id/responses/:responseId/accept",
		zValidator("param", acceptHelpParamsSchema),
		async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}
			const { id: pulseId, responseId } = c.req.valid("param");
			const result = await responseService.acceptHelpOffer(
				session.user.id,
				pulseId,
				responseId,
			);
			if (!result) {
				return c.json(
					{
						success: false,
						message: "Offer not found or already handled",
						data: null,
					},
					404,
				);
			}
			const owner = await userRepository.getOne(session.user.id);
			const ownerName = owner?.name ?? "Neighbor";
			await notificationService.notifyResponderHelpAccepted({
				responderUserId: result.responderId,
				pulseId,
				pulseTitle: result.pulseTitle,
				ownerName,
				responseId: result.accepted.id,
			});
			return c.json({
				success: true,
				message: "Help offer accepted",
				data: result.accepted,
			});
		},
	)
	.post(
		"/:id/responses",
		zValidator("param", pulseIdParamSchema),
		zValidator("json", offerHelpBodySchema),
		async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}
			const { id: pulseId } = c.req.valid("param");
			const { note } = c.req.valid("json");
			const pulse = await pulseService.getPulseById(pulseId);
			if (!pulse) {
				return c.json(
					{ success: false, message: "Pulse not found", data: null },
					404,
				);
			}
			if (pulse.userId === session.user.id) {
				return c.json(
					{
						success: false,
						message: "You cannot respond to your own pulse",
						data: null,
					},
					400,
				);
			}
			if (pulse.status !== PulseStatusEnum.Active) {
				return c.json(
					{
						success: false,
						message: "This pulse is no longer active",
						data: null,
					},
					400,
				);
			}
			const existing = await responseRepository.findByPulseAndResponder(
				pulseId,
				session.user.id,
			);
			if (existing) {
				return c.json(
					{
						success: false,
						message: "You already offered help on this pulse",
						data: null,
					},
					409,
				);
			}
			const created = await responseService.offerHelp(pulseId, session.user.id);
			if (!created) {
				return c.json(
					{ success: false, message: "Failed to offer help", data: null },
					500,
				);
			}
			const responder = await userRepository.getOne(session.user.id);
			const responderName = responder?.name ?? "A neighbor";
			await notificationService.notifyPulseOwnerOfResponse({
				ownerUserId: pulse.userId,
				responseId: created.id,
				pulseId: pulse.id,
				pulseTitle: pulse.title,
				responderId: session.user.id,
				responderName,
				note,
			});
			return c.json({
				success: true,
				message: "Help offer recorded",
				data: created,
			});
		},
	)
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
						console.log(result.data);
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
