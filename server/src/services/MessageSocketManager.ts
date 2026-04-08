import { logger } from "@server/utils/Logger";
import type { WSContext } from "hono/ws";

type MessageSocketPayload<T = unknown> = {
	id?: string;
	channelName: `${string}:${string}`;
	data: T;
	message: string | null;
	success: boolean;
};

type MessageConnection = {
	userId: string;
	ws: WSContext;
};

export class MessageSocketManager {
	private connections = new Map<WSContext, MessageConnection>();

	public register(ws: WSContext, userId: string) {
		this.connections.set(ws, { userId, ws });
		logger.info(
			`MessageSocketManager: Registered User[${userId}]. Active connections: ${this.connections.size}`,
		);
	}

	public unregister(ws: WSContext) {
		const connection = this.connections.get(ws);
		if (!connection) {
			return;
		}

		this.connections.delete(ws);
		logger.info(
			`MessageSocketManager: Unregistered User[${connection.userId}]. Remaining: ${this.connections.size}`,
		);
	}

	public hasConnectionsForUser(userId: string) {
		return this.getConnectionsForUser(userId).length > 0;
	}

	public getConnectionsForUser(userId: string) {
		return Array.from(this.connections.values()).filter(
			(connection) => connection.userId === userId,
		);
	}

	public send(ws: WSContext, payload: MessageSocketPayload) {
		ws.send(JSON.stringify(payload));
	}

	public sendToUsers(
		userIds: string[],
		payload: MessageSocketPayload,
		options: { except?: WSContext } = {},
	) {
		const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
		for (const userId of uniqueUserIds) {
			for (const connection of this.getConnectionsForUser(userId)) {
				if (options.except && connection.ws === options.except) {
					continue;
				}

				this.send(connection.ws, payload);
			}
		}
	}
}

const globalForMessageSocket = globalThis as unknown as {
	messageSocketManager: MessageSocketManager | undefined;
};

export const messageSocketManager =
	globalForMessageSocket.messageSocketManager ?? new MessageSocketManager();

if (process.env.NODE_ENV !== "production") {
	globalForMessageSocket.messageSocketManager = messageSocketManager;
}
