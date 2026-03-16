import { Toast } from "@heroui/react";

export type SocketConfigType = {
	baseURL: string;
	onmessage: <T = Record<string, any>>(response: SocketResponseType<T>) => void;
	onclose?: (event: CloseEvent) => void;
	onerror?: (event: Event) => void;
};

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
	status: number;
	isClientError: boolean;
	isServerError: boolean;
	isNotFound: boolean;
	isUnauthorized: boolean;
	isForbidden: boolean;
	isLocal: boolean;
	isDevelopment: boolean;
	isStaging: boolean;
	isProduction: boolean;
	debug: boolean;
	app: {
		url: string;
	};
};

export class Socket {
	private ws: WebSocket;
	private onmessage:
		| ((response: SocketResponseType<any>) => void)
		| null
		| undefined;

	constructor(readonly url: string) {
		const fullURL = this.buildURL(this.url);
		this.ws = new WebSocket(fullURL);
	}

	public on<T>(
		event: "message",
		callback: (response: SocketResponseType<T>) => void,
	): void {
		if (event === "message") {
			this.onmessage = callback;
		}
	}

	public send(payload: SocketPayloadType): void {
		this.ws.onmessage = (event) => {
			const response = JSON.parse(event.data) as SocketResponseType;

			if (response.success) {
				this.onmessage?.(response);
				return;
			}

			console.error(response);
			if (response.isServerError) {
				Toast.toast.danger(response.message || "An error occurred");
				return;
			}

			this.onmessage?.(response);
		};

		this.ws.onopen = () => {
			this.ws?.send(JSON.stringify(payload));
		};
	}

	public close(code?: number, reason?: string): void {
		try {
			this.ws.close(code, reason);
		} catch (error) {
			console.error(error);
		}

		if (!this.ws) {
			return;
		}

		if (
			this.ws.readyState === WebSocket.OPEN ||
			this.ws.readyState === WebSocket.CONNECTING
		) {
			this.ws.close(code, reason);
		}
	}

	buildURL(url: string): string {
		if (url.startsWith("ws://") || url.startsWith("wss://")) {
			return url;
		}

		// Convert HTTP(S) to WebSocket protocol
		if (url.startsWith("http://")) {
			url = url.replace("http://", "ws://");
		} else if (url.startsWith("https://")) {
			url = url.replace("https://", "wss://");
		} else if (!url.startsWith("ws://") && !url.startsWith("wss://")) {
			url = `wss://${url}`;
		}

		return url;
	}
}
