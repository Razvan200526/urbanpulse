import { zValidator } from "@hono/zod-validator";
import { resourceService } from "@server/services/ResourceService";
import { Hono } from "hono";
import { getResourcesSchema } from "@shared/validators/resources/isGetResourcesQueryValid";
import { resourceRepository } from "@server/repositories/ResourceRepository";
export const resourceController = new Hono()
	.get("/", zValidator("query", getResourcesSchema), async (c) => {
		const { _userId } = c.req.query();

		const resources = await resourceRepository.getAll();

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
	});
