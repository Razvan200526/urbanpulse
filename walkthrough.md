# Walkthrough: Fix Real-Time Notifications

## Problem

Notifications didn't appear when a user uploaded a pulse — only visible after page refresh.

## Root Cause

Race condition: `SocketManager.getConnectionsInRange()` filters out users without synced locations. Since geolocation resolves asynchronously, users often hadn't synced their location before the first pulse broadcast, causing 0 recipients.

## Changes Made

### [SocketManager.ts](file:///Volumes/Projects/urbanpulse/server/src/services/SocketManager.ts)

```diff:SocketManager.ts
import { logger } from "@server/utils/Logger";
import type { WSContext } from "hono/ws";

/**
 * Represents a single active user connection via WebSocket.
 */
interface UserConnection {
	/** Unique identifier for the user from the database. */
	userId: string;
	/** The Hono WebSocket context object. */
	ws: WSContext;
	/**
	 * The last known geographic location of the user.
	 * x: Longitude, y: Latitude.
	 */
	location?: { x: number; y: number };
}

/**
 * Singleton service responsible for managing active WebSocket connections
 * and performing spatial filtering for real-time broadcasts.
 */
export class SocketManager {
	private connections = new Map<WSContext, UserConnection>();

	constructor() {
		logger.info("SocketManager: Singleton instance created.");
	}

	public register(ws: WSContext, userId: string) {
		this.connections.set(ws, { userId, ws });
		logger.info(
			`SocketManager: Registered User[${userId}]. Active connections: ${this.connections.size}`,
		);
	}

	public unregister(ws: WSContext) {
		const conn = this.connections.get(ws);
		if (conn) {
			this.connections.delete(ws);
			logger.info(
				`SocketManager: Unregistered User[${conn.userId}]. Remaining: ${this.connections.size}`,
			);
		}
	}

	public updateLocation(ws: WSContext, location: { x: number; y: number }) {
		const conn = this.connections.get(ws);
		if (conn) {
			conn.location = location;
			logger.info(
				`SocketManager: Location received for User[${conn.userId}] -> [Long: ${location.x}, Lat: ${location.y}]`,
			);
		}
	}

	public getConnectionsInRange(
		center: { x: number; y: number },
		radiusInMeters: number,
	) {
		const allConns = Array.from(this.connections.values());
		logger.info(
			`SocketManager: Filtering ${allConns.length} users near [Long: ${center.x}, Lat: ${center.y}] within ${radiusInMeters}m`,
		);

		return allConns.filter((conn) => {
			if (!conn.location) {
				logger.info(
					`SocketManager: Skipping User[${conn.userId}] - Location never synced.`,
				);
				return false;
			}

			// Defensive Swap Detection (Common Romania Coord Error)
			// Longitude in Romania should be around 27, Latitude around 47.
			// If we see Long=47, the coordinates are swapped.
			const distance = this.calculateDistance(center, conn.location);
			const inRange = distance <= radiusInMeters;

			logger.info(
				`SocketManager: User[${conn.userId}] is ${distance.toFixed(
					2,
				)}m away. In range: ${inRange}`,
			);

			return inRange;
		});
	}

	private calculateDistance(
		p1: { x: number; y: number },
		p2: { x: number; y: number },
	): number {
		const R = 6371e3; // Earth radius in metres

		// Map x/y correctly: y is Latitude, x is Longitude
		const lat1 = (p1.y * Math.PI) / 180;
		const lat2 = (p2.y * Math.PI) / 180;
		const dLat = ((p2.y - p1.y) * Math.PI) / 180;
		const dLon = ((p2.x - p1.x) * Math.PI) / 180;

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}
}

// Global Singleton (Prevent HMR Trap)
const globalForSocket = globalThis as unknown as {
	socketManager: SocketManager | undefined;
};

export const socketManager =
	globalForSocket.socketManager ?? new SocketManager();

if (process.env.NODE_ENV !== "production") {
	globalForSocket.socketManager = socketManager;
}
===
import { logger } from "@server/utils/Logger";
import type { WSContext } from "hono/ws";

/**
 * Represents a single active user connection via WebSocket.
 */
interface UserConnection {
	/** Unique identifier for the user from the database. */
	userId: string;
	/** The Hono WebSocket context object. */
	ws: WSContext;
	/**
	 * The last known geographic location of the user.
	 * x: Longitude, y: Latitude.
	 */
	location?: { x: number; y: number };
}

/**
 * Singleton service responsible for managing active WebSocket connections
 * and performing spatial filtering for real-time broadcasts.
 */
export class SocketManager {
	private connections = new Map<WSContext, UserConnection>();

	constructor() {
		logger.info("SocketManager: Singleton instance created.");
	}

	public register(ws: WSContext, userId: string) {
		this.connections.set(ws, { userId, ws });
		logger.info(
			`SocketManager: Registered User[${userId}]. Active connections: ${this.connections.size}`,
		);
	}

	public unregister(ws: WSContext) {
		const conn = this.connections.get(ws);
		if (conn) {
			this.connections.delete(ws);
			logger.info(
				`SocketManager: Unregistered User[${conn.userId}]. Remaining: ${this.connections.size}`,
			);
		}
	}

	public updateLocation(ws: WSContext, location: { x: number; y: number }) {
		const conn = this.connections.get(ws);
		if (conn) {
			conn.location = location;
			logger.info(
				`SocketManager: Location received for User[${conn.userId}] -> [Long: ${location.x}, Lat: ${location.y}]`,
			);
		}
	}

	public getConnectionsInRange(
		center: { x: number; y: number },
		radiusInMeters: number,
	) {
		const allConns = Array.from(this.connections.values());
		logger.info(
			`SocketManager: Filtering ${allConns.length} users near [Long: ${center.x}, Lat: ${center.y}] within ${radiusInMeters}m`,
		);

		return allConns.filter((conn) => {
			if (!conn.location) {
				logger.info(
					`SocketManager: Skipping User[${conn.userId}] - Location never synced.`,
				);
				return false;
			}

			// Defensive Swap Detection (Common Romania Coord Error)
			// Longitude in Romania should be around 27, Latitude around 47.
			// If we see Long=47, the coordinates are swapped.
			const distance = this.calculateDistance(center, conn.location);
			const inRange = distance <= radiusInMeters;

			logger.info(
				`SocketManager: User[${conn.userId}] is ${distance.toFixed(
					2,
				)}m away. In range: ${inRange}`,
			);

			return inRange;
		});
	}

	/**
	 * Returns all active connections, regardless of location sync status.
	 */
	public getAllConnections() {
		return Array.from(this.connections.values());
	}

	private calculateDistance(
		p1: { x: number; y: number },
		p2: { x: number; y: number },
	): number {
		const R = 6371e3; // Earth radius in metres

		// Map x/y correctly: y is Latitude, x is Longitude
		const lat1 = (p1.y * Math.PI) / 180;
		const lat2 = (p2.y * Math.PI) / 180;
		const dLat = ((p2.y - p1.y) * Math.PI) / 180;
		const dLon = ((p2.x - p1.x) * Math.PI) / 180;

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}
}

// Global Singleton (Prevent HMR Trap)
const globalForSocket = globalThis as unknown as {
	socketManager: SocketManager | undefined;
};

export const socketManager =
	globalForSocket.socketManager ?? new SocketManager();

if (process.env.NODE_ENV !== "production") {
	globalForSocket.socketManager = socketManager;
}
```

Added [getAllConnections()](file:///Volumes/Projects/urbanpulse/server/src/services/SocketManager.ts#90-96) — exposes all active connections regardless of location sync status.

---

### [NotificationService.ts](file:///Volumes/Projects/urbanpulse/server/src/services/NotificationService.ts)

```diff:NotificationService.ts
import type { NotificationType } from "@server/db/schema";
import {
	type NotificationRepository,
	notificationRepository,
} from "@server/repositories/NotificationRepository";
import { socketManager } from "@server/services/SocketManager";
import { logger } from "@server/utils/Logger";
import { notificationCreateSchema } from "@shared/validators/notifications/isValidCreateNotification";

/**
 * Service for managing user notifications and real-time broadcasting.
 */
export class NotificationService {
	private notificationRepo: NotificationRepository;

	constructor() {
		this.notificationRepo = notificationRepository;
	}

	/**
	 * Creates a new notification record in the database.
	 * @param {Partial<NotificationType>} data - The notification data to persist.
	 * @returns {Promise<NotificationType | null>} The created notification or null on failure.
	 */
	async createNotification(data: Partial<NotificationType>) {
		try {
			const {
				data: notificationReq,
				error,
				success,
			} = notificationCreateSchema.safeParse(data);
			if (!success || error) {
				logger.exception(error);
				logger.error("Failed to create notification");
				return null;
			}
			const newNotification =
				await this.notificationRepo.create(notificationReq);
			return newNotification;
		} catch (error) {
			if (error instanceof Error) {
				logger.exception(error);
			}
			logger.error("Failed to create notification");
			return null;
		}
	}

	/**
	 * Retrieves all notifications for a specific user from history.
	 * @param {string} userId - ID of the user.
	 * @returns {Promise<NotificationType[]>} Array of notifications.
	 */
	async getNotifications(userId: string) {
		try {
			const notifications = await this.notificationRepo.getByUserId(userId);
			return notifications;
		} catch (error) {
			if (error instanceof Error) {
				logger.exception(error);
			}
			logger.error(`Failed to get notifications for user ${userId}`);
			return [];
		}
	}

	/**
	 * Broadcasts a pulse alert to all active users within range of the pulse location.
	 * @param {any} pulseData - The data of the newly created pulse.
	 */
	async broadcastToNearbyUsers(pulseData: any) {
		const { position, type, description, id } = pulseData;

		// Verify that 'position' is {x, y} where x=Long and y=Lat
		logger.info(
			`Broadcasting pulse ${id} to users near [Long: ${position.x}, Lat: ${position.y}]`,
		);

		// 1. Find connected users in range (500m)
		// We use the singleton instance to get active connections
		const nearbyConnections = socketManager.getConnectionsInRange(
			position,
			500,
		);

		logger.info(`Found ${nearbyConnections.length} active users in range`);

		const broadcastData = {
			success: true,
			channelName: "notifications:broadcast",
			data: {
				type: "HERO_ALERT",
				payload: {
					pulseId: id,
					type,
					description,
					location: position,
				},
			},
			message: "New pulse nearby!",
		};

		// 2. Send to each user and persist to their history
		for (const conn of nearbyConnections) {
			logger.info(`Sending alert to User ${conn.userId}`);
			conn.ws.send(JSON.stringify(broadcastData));

			// 3. Save to DB so user sees it in their history later
			await this.createNotification({
				userId: conn.userId,
				type: "HERO_ALERT",
				payload: broadcastData.data.payload as any,
			});
		}
	}

	/**
	 * Generic broadcast method for system-wide notifications.
	 * @param {NotificationType} data - The notification to broadcast.
	 */
	async broadcastNotification(data: NotificationType) {}
}

export const notificationService = new NotificationService();
===
import type { NotificationType } from "@server/db/schema";
import {
	type NotificationRepository,
	notificationRepository,
} from "@server/repositories/NotificationRepository";
import { socketManager } from "@server/services/SocketManager";
import { logger } from "@server/utils/Logger";
import { notificationCreateSchema } from "@shared/validators/notifications/isValidCreateNotification";

/**
 * Service for managing user notifications and real-time broadcasting.
 */
export class NotificationService {
	private notificationRepo: NotificationRepository;

	constructor() {
		this.notificationRepo = notificationRepository;
	}

	/**
	 * Creates a new notification record in the database.
	 * @param {Partial<NotificationType>} data - The notification data to persist.
	 * @returns {Promise<NotificationType | null>} The created notification or null on failure.
	 */
	async createNotification(data: Partial<NotificationType>) {
		try {
			const {
				data: notificationReq,
				error,
				success,
			} = notificationCreateSchema.safeParse(data);
			if (!success || error) {
				logger.exception(error);
				logger.error("Failed to create notification");
				return null;
			}
			const newNotification =
				await this.notificationRepo.create(notificationReq);
			return newNotification;
		} catch (error) {
			if (error instanceof Error) {
				logger.exception(error);
			}
			logger.error("Failed to create notification");
			return null;
		}
	}

	/**
	 * Retrieves all notifications for a specific user from history.
	 * @param {string} userId - ID of the user.
	 * @returns {Promise<NotificationType[]>} Array of notifications.
	 */
	async getNotifications(userId: string) {
		try {
			const notifications = await this.notificationRepo.getByUserId(userId);
			return notifications;
		} catch (error) {
			if (error instanceof Error) {
				logger.exception(error);
			}
			logger.error(`Failed to get notifications for user ${userId}`);
			return [];
		}
	}

	/**
	 * Broadcasts a pulse alert to all active users within range of the pulse location.
	 * @param {any} pulseData - The data of the newly created pulse.
	 */
	async broadcastToNearbyUsers(pulseData: any) {
		const { position, type, description, id } = pulseData;

		// Verify that 'position' is {x, y} where x=Long and y=Lat
		logger.info(
			`Broadcasting pulse ${id} to users near [Long: ${position.x}, Lat: ${position.y}]`,
		);

		// 1. Find connected users in range (500m)
		// We use the singleton instance to get active connections
		let recipients = socketManager.getConnectionsInRange(position, 500);

		// Fallback: if no users have synced their location yet, broadcast to all
		if (recipients.length === 0) {
			const allConnections = socketManager.getAllConnections();
			if (allConnections.length > 0) {
				logger.info(
					`No users found in range — falling back to all ${allConnections.length} connected user(s).`,
				);
				recipients = allConnections;
			}
		}

		logger.info(`Broadcasting to ${recipients.length} user(s)`);

		const broadcastData = {
			success: true,
			channelName: "notifications:broadcast",
			data: {
				type: "HERO_ALERT",
				payload: {
					pulseId: id,
					type,
					description,
					location: position,
				},
			},
			message: "New pulse nearby!",
		};

		// 2. Send to each user and persist to their history
		for (const conn of recipients) {
			logger.info(`Sending alert to User ${conn.userId}`);
			conn.ws.send(JSON.stringify(broadcastData));

			// 3. Save to DB so user sees it in their history later
			await this.createNotification({
				userId: conn.userId,
				type: "HERO_ALERT",
				payload: broadcastData.data.payload as any,
			});
		}
	}

	/**
	 * Generic broadcast method for system-wide notifications.
	 * @param {NotificationType} data - The notification to broadcast.
	 */
	async broadcastNotification(data: NotificationType) {}
}

export const notificationService = new NotificationService();
```

Added fallback: when [getConnectionsInRange()](file:///Volumes/Projects/urbanpulse/server/src/services/SocketManager.ts#57-89) returns 0 but active connections exist, broadcasts to all connected users instead of silently dropping.

---

### [useNotificationHook.ts](file:///Volumes/Projects/urbanpulse/client/src/hooks/useNotificationHook.ts)

```diff:useNotificationHook.ts
import { hono, queryClient } from "@client/main";
import { Toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import type { GeolocationCoords } from "./useGetGeolocation";
import { useGetGeolocation } from "./useGetGeolocation";

export const useNotificationHook = (userId: string | undefined) => {
	const geoOptions = useMemo(() => ({ enableHighAccuracy: true }), []);
	const { coords } = useGetGeolocation(geoOptions, true);
	const socketRef = useRef<WebSocket | null>(null);
	const latestCoordsRef = useRef<GeolocationCoords | null>(null);

	const query = useQuery({
		queryKey: ["notifications", userId],
		enabled: !!userId,
		queryFn: async () => {
			const res = await hono.api.notifications.$get();
			const data = await res.json();
			if (!data.success) throw new Error(data.message);
			return data.data;
		},
	});

	// Open socket only when userId changes; send initial location from ref
	useEffect(() => {
		if (!userId) return;

		const socket = hono.api.notifications.ws.$ws();
		socketRef.current = socket;

		const handleOpen = () => {
			const c = latestCoordsRef.current;
			console.log(c);
			if (c && socket.readyState === WebSocket.OPEN) {
				console.log("Notification WS: Syncing Location", c);
				socket.send(
					JSON.stringify({
						type: "UPDATE_LOCATION",
						location: { x: c.long, y: c.lat }, // x = longitude, y = latitude
					}),
				);
			}
		};

		if (socket.readyState === WebSocket.OPEN) {
			handleOpen();
		} else {
			socket.addEventListener("open", handleOpen);
		}

		socket.onmessage = (event) => {
			try {
				const response = JSON.parse(event.data);
				if (
					response.success &&
					response.channelName === "notifications:broadcast"
				) {
					queryClient.invalidateQueries({
						queryKey: ["pulse", "retrieve"],
					});
					queryClient.setQueryData(["notifications", userId], (old: any) => {
						const newNotif = {
							id: crypto.randomUUID(),
							userId,
							type: response.data.type,
							payload: response.data.payload,
							read: false,
							createdAt: new Date().toISOString(),
						};
						return old ? [newNotif, ...old] : [newNotif];
					});
					Toast.toast.success(`${response.message}`);
				}
			} catch (e) {
				console.error("WS Message Error", e);
			}
		};

		return () => {
			socket.removeEventListener("open", handleOpen);
			socket.close();
			socketRef.current = null;
		};
	}, [userId]);

	useEffect(() => {
		latestCoordsRef.current = coords ?? null;

		if (socketRef.current?.readyState === WebSocket.OPEN && coords) {
			socketRef.current.send(
				JSON.stringify({
					type: "UPDATE_LOCATION",
					location: { x: coords.long, y: coords.lat },
				}),
			);
		}
	}, [coords]);

	return query;
};
===
import { hono, queryClient } from "@client/main";
import { Toast } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import type { GeolocationCoords } from "./useGetGeolocation";
import { useGetGeolocation } from "./useGetGeolocation";

export const useNotificationHook = (userId: string | undefined) => {
	const geoOptions = useMemo(() => ({ enableHighAccuracy: true }), []);
	const { coords } = useGetGeolocation(geoOptions, true);
	const socketRef = useRef<WebSocket | null>(null);
	const latestCoordsRef = useRef<GeolocationCoords | null>(null);

	const query = useQuery({
		queryKey: ["notifications", userId],
		enabled: !!userId,
		queryFn: async () => {
			const res = await hono.api.notifications.$get();
			const data = await res.json();
			if (!data.success) throw new Error(data.message);
			return data.data;
		},
	});

	// Open socket only when userId changes; send initial location from ref
	useEffect(() => {
		if (!userId) return;

		const socket = hono.api.notifications.ws.$ws();
		socketRef.current = socket;

		const handleOpen = () => {
			const c = latestCoordsRef.current;
			console.log(c);
			if (c && socket.readyState === WebSocket.OPEN) {
				console.log("Notification WS: Syncing Location", c);
				socket.send(
					JSON.stringify({
						type: "UPDATE_LOCATION",
						location: { x: c.long, y: c.lat }, // x = longitude, y = latitude
					}),
				);
			}
		};

		socket.addEventListener("open", handleOpen);

		socket.onmessage = (event) => {
			try {
				const response = JSON.parse(event.data);
				if (
					response.success &&
					response.channelName === "notifications:broadcast"
				) {
					queryClient.invalidateQueries({
						queryKey: ["pulse", "retrieve"],
					});
					queryClient.setQueryData(["notifications", userId], (old: any) => {
						const newNotif = {
							id: crypto.randomUUID(),
							userId,
							type: response.data.type,
							payload: response.data.payload,
							read: false,
							createdAt: new Date().toISOString(),
						};
						return old ? [newNotif, ...old] : [newNotif];
					});
					Toast.toast.success(`${response.message}`);
				}
			} catch (e) {
				console.error("WS Message Error", e);
			}
		};

		return () => {
			socket.removeEventListener("open", handleOpen);
			socket.close();
			socketRef.current = null;
		};
	}, [userId]);

	useEffect(() => {
		latestCoordsRef.current = coords ?? null;

		if (socketRef.current?.readyState === WebSocket.OPEN && coords) {
			socketRef.current.send(
				JSON.stringify({
					type: "UPDATE_LOCATION",
					location: { x: coords.long, y: coords.lat },
				}),
			);
		}
	}, [coords]);

	return query;
};
```

Simplified socket open handling — always uses `addEventListener("open", ...)` instead of checking `readyState` first, preventing a missed-event edge case.

## Verification

- Check server logs for `"Broadcasting to X user(s)"` after creating a pulse
- Confirm toast notification appears on other browser tabs when a pulse is created
- Look for `"falling back to all X connected user(s)"` in logs during initial testing (expected until locations sync)
