import { logger } from "@server/utils/Logger";
import { RedisClient as BunRedisClient } from "bun";

type RedisInitOptions = {
	required?: boolean;
};

class RedisClient {
	private client: BunRedisClient | null = null;
	private subscriber: BunRedisClient | null = null;
	private isConnected = false;
	private initPromise: Promise<void> | null = null;
	private static instance: RedisClient;

	private createClient() {
		const client = new BunRedisClient(Bun.env.REDIS_URL, {
			autoReconnect: true,
			maxRetries: 10,
			connectionTimeout: 5000,
			idleTimeout: 30000,
			enableOfflineQueue: true,
			enableAutoPipelining: true,
		});

		client.onconnect = () => {
			this.isConnected = true;
			logger.info("Connected to Redis");
		};

		client.onclose = (err) => {
			this.isConnected = false;
			if (err) {
				logger.exception(err);
			} else {
				logger.info("Disconnected from Redis");
			}
		};

		return client;
	}

	private getClient() {
		if (!this.client) {
			this.client = this.createClient();
		}

		return this.client;
	}

	private async connectInternal() {
		await this.getClient().connect();
	}

	private async ensureSubscriber() {
		if (!this.connected) {
			await this.init();
		}

		if (!this.connected || !this.client) {
			return null;
		}

		if (!this.subscriber) {
			this.subscriber = await this.client.duplicate();
		}

		return this.subscriber;
	}

	static getInstance(): RedisClient {
		if (!RedisClient.instance) {
			RedisClient.instance = new RedisClient();
		}

		return RedisClient.instance;
	}

	async init({ required = false }: RedisInitOptions = {}): Promise<void> {
		if (this.isConnected) {
			return;
		}

		if (!this.initPromise) {
			this.initPromise = this.connectInternal();
		}

		try {
			await this.initPromise;
		} catch (err) {
			this.initPromise = null;
			if (required) {
				throw err;
			}

			if (err instanceof Error) {
				logger.exception(err);
			}
		}
	}

	async cleanup(): Promise<void> {
		this.subscriber?.close();
		this.subscriber = null;
		this.client?.close();
		this.client = null;
		this.initPromise = null;
		this.isConnected = false;
		logger.info("Redis connections closed");
	}

	async get(key: string): Promise<string | null> {
		if (!this.connected || !this.client) {
			return null;
		}

		try {
			return await this.client.get(key);
		} catch (err) {
			if (err instanceof Error) {
				logger.exception(err);
			}
			return null;
		}
	}

	async set(key: string, value: string): Promise<void> {
		if (!this.connected || !this.client) {
			return;
		}

		try {
			await this.client.set(key, value);
		} catch (err) {
			if (err instanceof Error) {
				logger.exception(err);
			}
		}
	}

	async setex(key: string, ttl: number, value: string): Promise<void> {
		if (!this.connected || !this.client) {
			return;
		}

		try {
			await this.client.set(key, value, "EX", ttl);
		} catch (err) {
			if (err instanceof Error) {
				logger.exception(err);
			}
		}
	}

	async del(...keys: string[]): Promise<void> {
		if (!this.connected || !this.client || keys.length === 0) {
			return;
		}

		try {
			await this.client.del(...keys);
		} catch (err) {
			if (err instanceof Error) {
				logger.exception(err);
			}
		}
	}

	async keys(pattern: string): Promise<string[]> {
		if (!this.connected || !this.client) {
			return [];
		}

		try {
			return await this.client.keys(pattern);
		} catch (err) {
			if (err instanceof Error) {
				logger.exception(err);
			}
			return [];
		}
	}

	async incr(key: string): Promise<number | null> {
		if (!this.connected || !this.client) {
			return null;
		}

		try {
			return await this.client.incr(key);
		} catch (err) {
			if (err instanceof Error) {
				logger.exception(err);
			}
			return null;
		}
	}

	async subscribe(
		channel: string,
		callback: (message: string, channel: string) => void,
	): Promise<void> {
		try {
			const subscriber = await this.ensureSubscriber();
			if (!subscriber) {
				return;
			}

			await subscriber.subscribe(channel, callback);
		} catch (err) {
			if (err instanceof Error) {
				logger.exception(err);
			}
		}
	}

	get connected(): boolean {
		return this.isConnected;
	}
}

export default RedisClient;
