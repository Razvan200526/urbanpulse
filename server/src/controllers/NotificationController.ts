import auth from "@server/services/auth/AuthService";
import { socketManager } from "@server/services/SocketManager";
import { notificationService } from "@server/services/NotificationService";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { logger } from "@server/utils/Logger";

export const notificationController = new Hono()
	.get("/", async (c) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const notifications = await notificationService.getNotifications(
			session.user.id,
		);

		return c.json({
			success: true,
			message: "Notifications retrieved",
			data: notifications,
		});
	})
	.get(
		"/ws",
		upgradeWebSocket(async (c) => {
			const session = await auth.api.getSession({
				headers: c.req.raw.headers,
			});

			if (!session) {
				logger.error("Notification WS: Unauthorized - No session found");
				return {
					onOpen: (event, ws) => {
						ws.send(
							JSON.stringify({ success: false, message: "Unauthorized" }),
						);
						ws.close();
					},
				};
			}

			return {
				onOpen: (event, ws) => {
					logger.info(
						`Notification WS: Connection opened for User[${session.user.id}]`,
					);
					socketManager.register(ws, session.user.id);
				},
				onMessage: (event, ws) => {
					try {
						const data = JSON.parse(event.data.toString());
						if (data.type === "UPDATE_LOCATION" && data.location) {
							logger.info(
								`Notification WS: Location update from User[${session.user.id}]`,
							);
							socketManager.updateLocation(ws, data.location);
						}
					} catch (e) {
						logger.error("Notification WS: Failed to parse message");
					}
				},
				onClose: (event, ws) => {
					logger.info(
						`Notification WS: Connection closed for User[${session.user.id}]`,
					);
					socketManager.unregister(ws);
				},
			};
		}),
	);
