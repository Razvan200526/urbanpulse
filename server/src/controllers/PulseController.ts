import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "@server/middleware/authMiddleware";
import { responseRepository } from "@server/repositories/ResponseRepository";
import { userRepository } from "@server/repositories/UserRepository";
import auth from "@server/services/auth/AuthService";
import { moderationService } from "@server/services/ModerationService";
import { notificationService } from "@server/services/NotificationService";
import { pulseService } from "@server/services/PulseService";
import { responseService } from "@server/services/ResponseService";
import { handleError } from "@server/utils/handleError";
import { PulseStatusEnum } from "@shared/types";
import { acceptHelpParamsSchema } from "@shared/validators/pulses/isAcceptHelpParamsValid";
import { confirmPulseParamsSchema } from "@shared/validators/pulses/isConfirmPulseValid";
import { offerHelpBodySchema } from "@shared/validators/pulses/isOfferHelpValid";
import {
	pulseIdParamSchema,
	pulseUpdateBodySchema,
} from "@shared/validators/pulses/isPulseUpdateValid";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";

export const pulseController = new Hono()
	.basePath("/pulse")
	.use(authMiddleware)
	.get("/:id", zValidator("param", pulseIdParamSchema), async (c) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const { id } = c.req.valid("param");
		const pulse = await pulseService.getPulseById(id);
		if (!pulse) {
			return c.json(
				{ success: false, message: "Pulse not found", data: null },
				404,
			);
		}

		const serialized = await pulseService.serializePulseForViewer(pulse, {
			id: session.user.id,
			role: session.user.role ?? "user",
		});

		return c.json({
			success: true,
			message: "Pulse retrieved",
			data: serialized,
		});
	})
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
			await notificationService.broadcastPulseUpdated(updated);
			return c.json({
				success: true,
				message: "Pulse updated",
				data: updated,
			});
		},
	)
	.post(
		"/:id/confirm",
		zValidator("param", confirmPulseParamsSchema),
		async (c) => {
			const session = c.var.session;
			if (!session) {
				return c.json(
					{ success: false, message: "Unauthorized", data: null },
					401,
				);
			}

			const { id } = c.req.valid("param");
			const result = await moderationService.confirmPulse(id, session.userId);

			if (!result.ok) {
				const status =
					result.code === "NOT_FOUND"
						? 404
						: result.code === "CONFLICT"
							? 409
							: result.code === "FORBIDDEN"
								? 403
								: 400;

				return c.json(
					{ success: false, message: result.message, data: null },
					status,
				);
			}

			return c.json({
				success: true,
				message: result.data.alreadyConfirmed
					? "Pulse already confirmed by you"
					: result.data.newlyVerified
						? "Pulse confirmed and verified"
						: "Pulse confirmed",
				data: result.data,
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
				conversationId: result.conversationId,
			});
			return c.json({
				success: true,
				message: "Help offer accepted",
				data: result.accepted,
			});
		},
	)
	.post(
		"/:id/responses/:responseId/reject",
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
			const result = await responseService.rejectHelpOffer(
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
			return c.json({
				success: true,
				message: "Help offer rejected",
				data: result,
			});
		},
	)
	.post(
		"/:id/responses",
		zValidator("param", pulseIdParamSchema),
		zValidator("json", offerHelpBodySchema),
		async (c) => {
			const session = c.var.session;
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
			if (pulse.userId === session.userId) {
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
				session.userId,
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
			const created = await responseService.offerHelp(pulseId, session.userId);
			if (!created) {
				return c.json(
					{ success: false, message: "Failed to offer help", data: null },
					500,
				);
			}
			const responder = await userRepository.getOne(session.userId);
			const responderName = responder?.name ?? "A neighbor";
			await notificationService.notifyPulseOwnerOfResponse({
				ownerUserId: pulse.userId,
				responseId: created.id,
				pulseId: pulse.id,
				pulseTitle: pulse.title,
				responderId: session.userId,
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
		upgradeWebSocket((c) => {
			const viewer = c.get("user");
			return {
				onOpen: () => {},
				onMessage: async (event, ws) => {
					try {
						const data = JSON.parse(event.data.toString());
						const response = await pulseService.handleSocketMessage(
							data,
							viewer,
						);
						ws.send(JSON.stringify(response));
					} catch (e) {
						if (e instanceof SyntaxError) {
							ws.send(
								JSON.stringify({
									success: false,
									message: "Invalid JSON payload",
									data: null,
								}),
							);
							return;
						}
						handleError(e);
						ws.send(
							JSON.stringify({
								success: false,
								message: "Failed to process pulse request",
								data: null,
							}),
						);
					}
				},
				onClose: () => {},
			};
		}),
	);
