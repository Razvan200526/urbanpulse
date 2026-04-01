import { authMiddleware } from "@server/middleware/authMiddleware";
import { dashboardService } from "@server/services/DashboardService";
import { Hono } from "hono";

export const dashboardController = new Hono()
	.basePath("/dashboard")
	.use(authMiddleware)
	.get("/overview", async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const overview = await dashboardService.getOverview();
		if (!overview) {
			return c.json(
				{
					success: false,
					message: "Failed to retrieve dashboard overview",
					data: null,
				},
				500,
			);
		}

		return c.json({
			success: true,
			message: "Dashboard overview retrieved",
			data: overview,
		});
	});
