import type { Variables } from "@server/app";
import auth from "@server/services/auth/AuthService";
import { notificationService } from "@server/services/NotificationService";
import { socketManager } from "@server/services/SocketManager";
import { userService } from "@server/services/UserService";
import { logger } from "@server/utils/Logger";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";

export const notificationController = new Hono<{ Variables: Variables }>()
	.basePath("/notifications")
	.get("/", async (c) => {
		const session = c.get("session");

		if (!session) {
			return c.json(
				{ success: false, message: "Unauthorized", data: null },
				401,
			);
		}

		const res = await notificationService.getNotificationsWithUsers(
			session.userId,
		);

		return c.json({
			success: true,
			message: "Notifications retrieved",
			data: { res },
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
					onOpen: (_event, ws) => {
						ws.send(
							JSON.stringify({ success: false, message: "Unauthorized" }),
						);
						ws.close();
					},
				};
			}

			return {
				onOpen: (_event, ws) => {
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
							void userService.updateLastKnownLocation(
								session.user.id,
								data.location,
							);
						}
					} catch (_e) {
						logger.error("Notification WS: Failed to parse message");
					}
				},
				onClose: (_event, ws) => {
					logger.info(
						`Notification WS: Connection closed for User[${session.user.id}]`,
					);
					socketManager.unregister(ws);
				},
			};
		}),
	);
