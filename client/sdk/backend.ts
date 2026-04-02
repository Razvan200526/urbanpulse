import { Socket } from "./Socket";

export class Backend {
	private _notifications: Socket | null = null;

	public get notifications(): Socket {
		if (!this._notifications) {
			this._notifications = new Socket(
				`${import.meta.env.VITE_SERVER_URL}/api/notifications/ws`,
			);
		}
		return this._notifications;
	}
}

export const backend = new Backend();
