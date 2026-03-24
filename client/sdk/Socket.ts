import { Toast } from "@heroui/react";

export type SocketChannelNameType = `${string}:${string}`;
export type SocketPayloadKeyType = `${string}:${string}`;

export type SocketPayloadType<T = Record<string, any>> = {
	id?: string;
	key?: SocketPayloadKeyType;
	channelName: SocketChannelNameType;
	data: T;
};

export type SocketResponseType<T = any> = {
	id?: string;
	key?: SocketPayloadKeyType;
	channelName: SocketChannelNameType;
	data: T;
	message: string | null;
	success: boolean;
};

export class Socket {
	private ws: WebSocket;
	private messageHandler: ((response: SocketResponseType<any>) => void) | null =
		null;

	constructor(readonly url: string) {
		this.ws = new WebSocket(this.buildURL(url));

		this.ws.onmessage = (event) => {
			try {
				const response = JSON.parse(event.data) as SocketResponseType;
				if (!response.success) {
					console.error(response);
					Toast.toast.danger(response.message || "An error occurred");
				}
				this.messageHandler?.(response);
			} catch (err) {
				console.error("Failed to parse WebSocket message", err);
			}
		};
	}

	public on<T>(
		event: "message",
		callback: (response: SocketResponseType<T>) => void,
	): void {
		if (event === "message") {
			this.messageHandler = callback;
		}
	}

	public send(payload: SocketPayloadType): void {
		const doSend = () => this.ws.send(JSON.stringify(payload));

		if (this.ws.readyState === WebSocket.OPEN) {
			doSend();
		} else {
			this.ws.addEventListener("open", doSend, { once: true });
		}
	}

	public close(code?: number, reason?: string): void {
		if (
			this.ws.readyState === WebSocket.OPEN ||
			this.ws.readyState === WebSocket.CONNECTING
		) {
			this.ws.close(code, reason);
		}
	}

	private buildURL(url: string): string {
		if (url.startsWith("ws://") || url.startsWith("wss://")) return url;
		if (url.startsWith("http://")) return url.replace("http://", "ws://");
		if (url.startsWith("https://")) return url.replace("https://", "wss://");
		return `wss://${url}`;
	}
}
