import { Socket } from "./Socket";

export class Backend {
	public readonly notifications: Socket;

	constructor() {
		this.notifications = new Socket(
			`${import.meta.env.VITE_SERVER_URL}/api/notifications/ws`,
		);
	}
}

export const backend = new Backend();
