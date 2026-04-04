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

type MessageHandler<T = any> = (response: SocketResponseType<T>) => void;

export class Socket {
	private ws: WebSocket;
	private messageHandlers: Set<MessageHandler> = new Set();
	private openHandlers: Set<() => void> = new Set();
	private _isOpen = false;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private manuallyClosed = false;
	private pendingPayloads: Array<SocketPayloadType | Record<string, unknown>> =
		[];

	constructor(readonly url: string) {
		this.ws = this.connect();
	}

	private connect() {
		const ws = new WebSocket(this.buildURL(this.url));

		ws.onopen = () => {
			this._isOpen = true;
			if (this.reconnectTimer) {
				clearTimeout(this.reconnectTimer);
				this.reconnectTimer = null;
			}
			for (const payload of this.pendingPayloads) {
				ws.send(JSON.stringify(payload));
			}
			this.pendingPayloads = [];
			for (const handler of this.openHandlers) handler();
		};

		ws.onclose = () => {
			this._isOpen = false;
			if (this.manuallyClosed || this.reconnectTimer) {
				return;
			}
			this.reconnectTimer = setTimeout(() => {
				this.reconnectTimer = null;
				this.ws = this.connect();
			}, 1000);
		};

		ws.onmessage = (event) => {
			try {
				const response = JSON.parse(event.data) as SocketResponseType;
				if (response.success === false) {
					Toast.toast.danger(response.message || "An error occurred");
				}
				for (const handler of this.messageHandlers) handler(response);
			} catch (_err) {}
		};

		return ws;
	}

	/** Whether the underlying WebSocket connection is open. */
	public get isOpen(): boolean {
		return this._isOpen;
	}

	/**
	 * Register a listener for socket events.
	 * Returns an unsubscribe function for easy cleanup.
	 */
	public on<T>(
		event: "message",
		callback: (response: SocketResponseType<T>) => void,
	): () => void;
	public on(event: "open", callback: () => void): () => void;
	public on(event: "message" | "open", callback: (...args: any[]) => void) {
		if (event === "message") {
			this.messageHandlers.add(callback);
			return () => this.messageHandlers.delete(callback);
		}
		if (event === "open") {
			this.openHandlers.add(callback);
			// If already open, fire immediately
			if (this._isOpen) callback();
			return () => this.openHandlers.delete(callback);
		}
		return () => {};
	}

	public send(payload: SocketPayloadType): void;
	public send(raw: Record<string, unknown>): void;
	public send(payload: SocketPayloadType | Record<string, unknown>): void {
		if (this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(payload));
		} else {
			this.pendingPayloads.push(payload);
			if (
				this.ws.readyState === WebSocket.CLOSED &&
				!this.manuallyClosed &&
				!this.reconnectTimer
			) {
				this.ws = this.connect();
			}
		}
	}

	public close(code?: number, reason?: string): void {
		this.manuallyClosed = true;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
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
