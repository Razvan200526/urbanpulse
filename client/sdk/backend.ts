import {
	buildAiWebSocketUrl,
	buildApiWebSocketUrl,
	getAiOrigin,
} from "@client/utils/runtimeOrigin";
import { Fetcher } from "./Fetcher";
import { PetAlertFetcher } from "./PetAlertFetcher";
import { PetAlertMatchFetcher } from "./PetAlertMatchFetcher";
import { Socket } from "./Socket";

export class Backend {
	private readonly aiFetcher: Fetcher;
	private _notifications: Socket | null = null;
	private _messages: Socket | null = null;
	private _petAlertUploads: Socket | null = null;
	private _petAlertUploadsUserId: string | null = null;

	public readonly petAlerts: PetAlertFetcher;
	public readonly petAlertMatches: PetAlertMatchFetcher;

	constructor() {
		this.aiFetcher = new Fetcher({
			baseURL: getAiOrigin(),
			headers: {},
		});
		this.petAlerts = new PetAlertFetcher(this.aiFetcher);
		this.petAlertMatches = new PetAlertMatchFetcher(this.aiFetcher);
	}

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

	public petAlertUploads(userId: string): Socket {
		if (!this._petAlertUploads || this._petAlertUploadsUserId !== userId) {
			this._petAlertUploads?.close(
				1000,
				"Reconnecting pet alert uploads for a new user.",
			);
			const url = new URL(buildAiWebSocketUrl("/api/v1/pet-alerts/ws"));
			url.searchParams.set("userId", userId);
			this._petAlertUploads = new Socket(url.toString());
			this._petAlertUploadsUserId = userId;
		}
		return this._petAlertUploads;
	}
}

export const backend = new Backend();
