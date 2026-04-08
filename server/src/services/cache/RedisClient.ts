// redisClient.ts
import { RedisClient as BunRedisClient } from "bun";
import { logger } from "@server/utils/Logger";
class RedisClient {
  private client: BunRedisClient;
  private subscriber: BunRedisClient | null = null;
  private isConnected: boolean = false;
  private static instance: RedisClient;

  constructor() {
    this.client = new BunRedisClient(process.env.REDIS_URL ?? "redis://localhost:6379", {
      autoReconnect: true,
      maxRetries: 10,
      connectionTimeout: 5000,
      idleTimeout: 30000,
      enableOfflineQueue: true,
      enableAutoPipelining: true,
    });

    this.client.onconnect = () => {
      this.isConnected = true;
      logger.info("Connected");
    };

    this.client.onclose = (err) => {
      this.isConnected = false;
      if (err) logger.exception(err);
      else logger.info("Disconnected");
    };
  }

  //Singleton 

  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  //lifecycle 

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (err) {
        if(err instanceof Error)
      logger.exception(err);
      
    }
  }

  async cleanup(): Promise<void> {
    this.subscriber?.close();
    this.client.close();
    this.isConnected = false;
    logger.info("Connection closed");
  }

  //Core Options

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      if(err instanceof Error)
      logger.exception(err);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.client.set(key, value);
    } catch (err) {
      if(err instanceof Error)
      logger.exception(err);
    }
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    try {
      await this.client.set(key, value, "EX", ttl);
    } catch (err) {
      if(err instanceof Error)
      logger.exception(err);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      if(err instanceof Error)
      logger.exception(err);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (err) {
      if(err instanceof Error)
      logger.exception(err);
      return [];
    }
  }

  async incr(key: string): Promise<number|null> {
    try {
      return await this.client.incr(key);
    } catch (err) {
      if(err instanceof Error)
      logger.exception(err);
      return null;
    }
  }

  //pub/sub

  async subscribe(channel: string, callback: (message: string, channel: string) => void): Promise<void> {
    try {
      // Subscriber needs a dedicated connection — cannot share with main client
      this.subscriber = await this.client.duplicate();
      await this.subscriber.subscribe(channel, callback);
    } catch (err) {
      if(err instanceof Error)
      logger.exception(err);
    }
  }

  //helper

  get connected(): boolean {
    return this.isConnected;
  }
}

export default RedisClient;