import { zValidator } from "@hono/zod-validator";
import type { Variables } from "@server/app";
import {
	PetMatchForbiddenError,
	PetMatchNotFoundError,
	petMatchService,
} from "@server/services/PetMatchService";
import {
	petMatchAlertIdParamSchema,
	petMatchCandidateNotificationBodySchema,
	petMatchIdParamSchema,
} from "@shared/validators/pet-matches/isPetMatchWorkflowValid";
import { Hono } from "hono";

const getInternalSecret = () =>
	Bun.env.PET_MATCH_INTERNAL_SECRET || "dev-pet-match-secret";

const jsonError = (
	message: string,
): { success: false; message: string; data: null } => ({
	success: false,
	message,
	data: null,
});

export const petMatchController = new Hono<{ Variables: Variables }>()
	.basePath("/pet-matches")
	.get(
		"/alerts/:petAlertId",
		zValidator("param", petMatchAlertIdParamSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(jsonError("Unauthorized"), 401);
			}

			try {
				const { petAlertId } = c.req.valid("param");
				const items = await petMatchService.listForAlert(
					petAlertId,
					session.userId,
				);

				return c.json({
					success: true,
					message: "Pet matches retrieved",
					data: items,
				});
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to load pet matches";
				const status =
					error instanceof PetMatchForbiddenError
						? 403
						: error instanceof PetMatchNotFoundError
							? 404
							: 400;
				return c.json(jsonError(message), status);
			}
		},
	)
	.get(
		"/:petMatchId",
		zValidator("param", petMatchIdParamSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(jsonError("Unauthorized"), 401);
			}

			try {
				const item = await petMatchService.getDetail(
					c.req.valid("param").petMatchId,
					session.userId,
				);
				return c.json({
					success: true,
					message: "Pet match retrieved",
					data: item,
				});
			} catch (error) {
				if (error instanceof PetMatchForbiddenError) {
					return c.json(jsonError(error.message), 403);
				}

				return c.json(
					jsonError(
						error instanceof Error ? error.message : "Pet match not found",
					),
					404,
				);
			}
		},
	)
	.post(
		"/:petMatchId/owner-interest",
		zValidator("param", petMatchIdParamSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(jsonError("Unauthorized"), 401);
			}

			try {
				const data = await petMatchService.markOwnerInterested(
					c.req.valid("param").petMatchId,
					session.userId,
				);
				return c.json({
					success: true,
					message: "Match confirmed for review",
					data,
				});
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Could not update pet match";
				const status =
					error instanceof PetMatchForbiddenError
						? 403
						: error instanceof PetMatchNotFoundError
							? 404
							: 409;
				return c.json(jsonError(message), status);
			}
		},
	)
	.post(
		"/:petMatchId/owner-dismiss",
		zValidator("param", petMatchIdParamSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(jsonError("Unauthorized"), 401);
			}

			try {
				const data = await petMatchService.dismissAsOwner(
					c.req.valid("param").petMatchId,
					session.userId,
				);
				return c.json({
					success: true,
					message: "Match dismissed",
					data,
				});
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Could not update pet match";
				const status =
					error instanceof PetMatchForbiddenError
						? 403
						: error instanceof PetMatchNotFoundError
							? 404
							: 409;
				return c.json(jsonError(message), status);
			}
		},
	)
	.post(
		"/:petMatchId/finder-accept",
		zValidator("param", petMatchIdParamSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(jsonError("Unauthorized"), 401);
			}

			try {
				const data = await petMatchService.acceptAsFinder(
					c.req.valid("param").petMatchId,
					session.userId,
				);
				return c.json({
					success: true,
					message: "Chat opened for this pet match",
					data,
				});
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Could not update pet match";
				const status =
					error instanceof PetMatchForbiddenError
						? 403
						: error instanceof PetMatchNotFoundError
							? 404
							: 409;
				return c.json(jsonError(message), status);
			}
		},
	)
	.post(
		"/:petMatchId/finder-decline",
		zValidator("param", petMatchIdParamSchema),
		async (c) => {
			const session = c.get("session");
			if (!session) {
				return c.json(jsonError("Unauthorized"), 401);
			}

			try {
				const data = await petMatchService.declineAsFinder(
					c.req.valid("param").petMatchId,
					session.userId,
				);
				return c.json({
					success: true,
					message: "Match request declined",
					data,
				});
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Could not update pet match";
				const status =
					error instanceof PetMatchForbiddenError
						? 403
						: error instanceof PetMatchNotFoundError
							? 404
							: 409;
				return c.json(jsonError(message), status);
			}
		},
	);

export const internalPetMatchController = new Hono<{ Variables: Variables }>()
	.basePath("/internal/pet-matches")
	.post(
		"/candidates",
		zValidator("json", petMatchCandidateNotificationBodySchema),
		async (c) => {
			const secret = c.req.header("x-pet-match-secret");
			if (!secret || secret !== getInternalSecret()) {
				return c.json(jsonError("Forbidden"), 403);
			}

			await petMatchService.notifyCandidateMatches(
				c.req.valid("json").petMatchIds,
			);

			return c.json({
				success: true,
				message: "Pet match notifications queued",
				data: { count: c.req.valid("json").petMatchIds.length },
			});
		},
	);
