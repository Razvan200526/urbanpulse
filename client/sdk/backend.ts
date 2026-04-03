import { buildApiWebSocketUrl } from "@client/utils/runtimeOrigin";
import { Socket } from "./Socket";

export class Backend {
	private _notifications: Socket | null = null;

	public get notifications(): Socket {
		if (!this._notifications) {
			this._notifications = new Socket(
				buildApiWebSocketUrl("/api/notifications/ws"),
			);
		}
		return this._notifications;
	}
}

export const backend = new Backend();
