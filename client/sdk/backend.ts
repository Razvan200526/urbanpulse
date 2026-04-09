import { buildApiWebSocketUrl } from "@client/utils/runtimeOrigin";
import { Socket } from "./Socket";

export class Backend {
	private _notifications: Socket | null = null;
	private _messages: Socket | null = null;

	public get notifications(): Socket {
		if (!this._notifications) {
			this._notifications = new Socket(
				buildApiWebSocketUrl("/api/notifications/ws"),
			);
		}
		return this._notifications;
	}

	public get messages(): Socket {
		if (!this._messages) {
			this._messages = new Socket(buildApiWebSocketUrl("/api/messages/ws"));
		}
		return this._messages;
	}
}

export const backend = new Backend();
