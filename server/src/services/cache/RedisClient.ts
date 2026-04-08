// redisClient.ts
import { RedisClient as BunRedisClient } from "bun";

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
      console.log("Connected");
    };

    this.client.onclose = (err) => {
      this.isConnected = false;
      if (err) console.error("Disconnected with error:", err);
      else console.log("Disconnected");
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
      console.error("Failed to connect:", err);
      throw err;
    }
  }

  async cleanup(): Promise<void> {
    this.subscriber?.close();
    this.client.close();
    this.isConnected = false;
    console.log("Connection closed");
  }

  //Core Options

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      console.error(`GET error for key "${key}":`, err);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.client.set(key, value);
    } catch (err) {
      console.error(`SET error for key "${key}":`, err);
      throw err;
    }
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    try {
      await this.client.set(key, value, "EX", ttl);
    } catch (err) {
      console.error(`SETEX error for key "${key}":`, err);
      throw err;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error(` DEL error for key "${key}":`, err);
      throw err;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (err) {
      console.error(`KEYS error for pattern "${pattern}":`, err);
      return [];
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (err) {
      console.error(`INCR error for key "${key}":`, err);
      throw err;
    }
  }

  //pub/sub

  async subscribe(channel: string, callback: (message: string, channel: string) => void): Promise<void> {
    try {
      // Subscriber needs a dedicated connection — cannot share with main client
      this.subscriber = await this.client.duplicate();
      await this.subscriber.subscribe(channel, callback);
    } catch (err) {
      console.error(`SUBSCRIBE error for channel "${channel}":`, err);
      throw err;
    }
  }

  //helper

  get connected(): boolean {
    return this.isConnected;
  }
}

export default RedisClient;