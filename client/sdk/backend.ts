import { Socket } from "./Socket";

export class Backend {
	public readonly socket: Socket;
	constructor() {
		this.socket = new Socket(`${import.meta.env.VITE_SERVER_URL}/api/ws/`);
	}
}

export const backend = new Backend();
