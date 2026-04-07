import { zValidator } from "@hono/zod-validator";
import type { Variables } from "@server/app";
import { resourceService } from "@server/services/ResourceService";
import { logger } from "@server/utils/Logger";
import {
	getOneResourceSchema,
	getResourcesSchema,
} from "@shared/validators/resources/isGetResourcesQueryValid";
import { resourceSchema } from "@shared/validators/resources/isResourceValid";
import { transactionRequestSchema } from "@shared/validators/transactions/isTransactionRequestValid";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { z } from "zod";

export const resourceController = new Hono<{ Variables: Variables }>()
	.basePath("/resources")
	.get("/", zValidator("query", getResourcesSchema), async (c) => {
		const query = c.req.valid("query");
		const resources = await resourceService.getFilteredResources(query);

		if (!resources) {
			return c.json(
				{ success: false, message: "No resources found", data: null },
				404,
			);
		}

		return c.json(
			{
				success: true,
				message: "Resources retrieved successfully",
				data: resources,
			},
			201,
		);
	})
	.get("/mine", zValidator("query", getResourcesSchema), async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const { filter } = c.req.valid("query");
		const resources = await resourceService.getResourcesByUserId(
			session.userId,
			filter,
		);

		if (!resources) {
			return c.json(
				{ success: false, message: "No resources found", data: null },
				404,
			);
		}

		return c.json({
			success: true,
			message: "Your resources retrieved successfully",
			data: resources,
		});
	})
	.get("/:resourceId", zValidator("param", getOneResourceSchema), async (c) => {
		const { resourceId } = c.req.param();
		const resource = await resourceService.getResourceById(resourceId);
		if (!resource) {
			return c.json({
				message: "Failed to get resource",
				data: null,
				success: false,
			});
		}
		return c.json({
			message: "Resource retrieved successfully",
			data: resource,
			success: true,
		});
	})
	.get(
		"/:resourceId/author",
		zValidator("param", getOneResourceSchema),
		async (c) => {
			const { resourceId } = c.req.param();
			const author = await resourceService.getResourceAuthor(resourceId);
			if (!author) {
				return c.json({
					message: "Failed to get author",
					data: null,
					success: false,
				});
			}
			return c.json({
				message: "Author retrieved successfully",
				data: author,
				success: true,
			});
		},
	)
	.post("/", zValidator("json", resourceSchema), async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}
		const body = await c.req.valid("json");
		const newResource = await resourceService.createResource(
			session.userId,
			body,
		);
		if (!newResource) {
			return c.json(
				{
					success: false,
					message: "Failed to create resource",
					data: null,
				},
				400,
			);
		}
		return c.json(
			{
				success: true,
				message: "Resource created successfully",
				data: newResource,
			},
			201,
		);
	})
	.get("/transaction/pending", async (c) => {
		const { userId } = c.req.query();
		if (!userId) {
			return c.json({ success: false, error: "Missing userId" }, 400);
		}

		const result = await resourceService.getPendingRequests(userId);
		return c.json(result, result.success ? 200 : 500);
	})
	.post(
		"/transaction/:transactionId/respond",
		zValidator(
			"json",
			z.object({
				accept: z.boolean(),
			}),
		),
		async (c) => {
			const { transactionId } = c.req.param();
			const body = c.req.valid("json");

			const result = await resourceService.respondToRequest(
				transactionId,
				body.accept,
			);
			return c.json(result, result.success ? 200 : 500);
		},
	)
	.get(
		"/transaction/ws",
		upgradeWebSocket(async () => {
			return {
				onOpen: () => {
					logger.info("Transaction websocket hit!");
				},
				onMessage: async (event, ws) => {
					const data = JSON.parse(event.data.toString());
					const {
						data: requestData,
						error,
						success,
					} = transactionRequestSchema.safeParse(data);
					if (!success || !requestData) {
						return ws.send(
							JSON.stringify({
								success: false,
								error: "Failed to request borrow",
								message: error.message,
							}),
						);
					}

					if (!requestData?.resourceId || !requestData?.borrowerId) {
						return ws.send(
							JSON.stringify({
								success: false,
								error: "Invalid request data: Missing resourceId or borrowerId",
							}),
						);
					}

					const result = await resourceService.requestBorrow({
						resourceId: requestData.resourceId,
						borrowerId: requestData.borrowerId,
					});

					if (!result.success) {
						return ws.send(
							JSON.stringify({
								success: false,
								error: result.error,
							}),
						);
					}

					ws.send(
						JSON.stringify({
							success: true,
							message: "Transaction created successfully",
							data: result.data,
						}),
					);
				},
				onClose: () => {
					logger.info("Transaction websocket closed");
				},
			};
		}),
	);
