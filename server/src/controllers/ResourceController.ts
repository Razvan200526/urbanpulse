import { zValidator } from "@hono/zod-validator";
import { resourceService } from "@server/services/ResourceService";
import { Hono } from "hono";
import { z } from "zod";
import {
	getOneResourceSchema,
	getResourcesSchema,
} from "@shared/validators/resources/isGetResourcesQueryValid";
import { upgradeWebSocket } from "hono/bun";
import { logger } from "@server/utils/Logger";
import { transactionRequestSchema } from "@shared/validators/transactions/isTransactionRequestValid";

export const resourceController = new Hono()
	.get("/", zValidator("query", getResourcesSchema), async (c) => {
		const { _userId } = c.req.query();

		const resources = await resourceService.getAllResource();

		if (!resources || resources.length === 0) {
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
	.post("/", async (c) => {
		const body = await c.req.json();
		const newResource = await resourceService.createResource(body);
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
			const body = await c.req.valid("json");

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
