import { incidentTypeService } from "@server/services/IncidentTypeService";
import { Hono } from "hono";

export const incidentTypeController = new Hono()
	.basePath("/incident-types")
	.get("/", async (c) => {
		const incidentTypes = await incidentTypeService.listActiveIncidentTypes();

		return c.json({
			success: true,
			message: "Incident types retrieved",
			data: incidentTypes,
		});
	});
