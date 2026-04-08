import RedisClient from "./RedisClient";

/**
 * Cache namespaces aligned with UrbanPulse services
 * Each service gets its own namespace to avoid key collisions
 */
type CacheNamespace =
  // User & Auth
  | "user"
  | "profile"
  | "session"
  | "auth"
  
  // Dashboard & Stats
  | "dashboard"
  | "stats"
  
  // Core Features
  | "pulse"
  | "resource"
  | "transaction"
  | "skill"
  
  // Messaging & Notifications
  | "conversation"
  | "message"
  | "notification"
  | "response"
  
  // Location & Matching
  | "location"
  | "heroAlert"
  
  // System
  | "rate"
  | "broadcast"
  | "weather"
  | "upload";

/**
 * Cache Key Patterns by Service:
 * 
 * UserService:
 *   user:${userId}                          - Full user profile
 *   profile:${userId}                       - User profile with details
 *   profile:${userId}:skills                - User skills list
 *   profile:${userId}:settings              - User settings
 * 
 * DashboardService:
 *   dashboard:${userId}:stats               - Dashboard statistics
 *   dashboard:${userId}:overview            - Dashboard overview data
 * 
 * PulseService:
 *   pulse:${pulseId}                        - Single pulse detail
 *   pulse:nearby:${lat}:${lng}:${radius}    - Nearby pulses (spatial)
 *   pulse:user:${userId}:list               - User's pulses
 *   pulse:active                            - Active pulses list
 * 
 * ResourceService:
 *   resource:${resourceId}                  - Resource detail
 *   resource:user:${userId}:list            - User's resources
 *   resource:search:${query}                - Resource search results
 * 
 * SkillService:
 *   skill:tags:all                          - All available skill tags
 *   skill:${userId}:tags                    - User's skills
 *   skill:matches:${pulseId}                - Matching skills for pulse
 * 
 * TransactionService:
 *   transaction:${transactionId}            - Transaction detail
 *   transaction:user:${userId}:history      - User's transactions
 * 
 * ConversationService:
 *   conversation:${conversationId}          - Conversation detail
 *   conversation:user:${userId}:list        - User's conversations
 * 
 * MessagingService:
 *   message:${messageId}                    - Message detail
 *   message:conversation:${convId}:list     - Messages in conversation
 * 
 * NotificationService:
 *   notification:user:${userId}:inbox       - User notifications
 *   notification:user:${userId}:unread      - Unread count
 * 
 * HeroAlertMatchingService:
 *   heroAlert:matches:${pulseId}            - Hero matches for pulse
 *   heroAlert:user:${userId}:nearby         - Nearby hero alerts for user
 * 
 * LocationService:
 *   location:user:${userId}:current         - User's current location
 *   location:nearby:${lat}:${lng}           - Nearby users/items
 * 
 * System:
 *   rate:${identifier}:${window}            - Rate limit counters
 *   session:${sessionId}                    - Session data
 *   weather:${location}                     - Weather cache
 */

interface CacheOptions {
  ttl?: number;        // seconds
  namespace?: CacheNamespace;
}

class CacheManager {
  private static instance: CacheManager;
  private redis: RedisClient;

  private readonly DEFAULT_TTL = 3600; // 1h

  private constructor() {
    this.redis = RedisClient.getInstance();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Key Building

  private buildKey(key: string, namespace?: CacheNamespace): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  // JSON-aware get/set
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const fullKey = this.buildKey(key, options.namespace);
    const raw = await this.redis.get(fullKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      // simple string
      return raw as unknown as T;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.buildKey(key, options.namespace);
    const ttl = options.ttl ?? this.DEFAULT_TTL;
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    await this.redis.setex(fullKey, ttl, serialized);
  }

  async del(key: string, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.buildKey(key, options.namespace);
    await this.redis.del(fullKey);
  }

  // Cache-aside pattern
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) return cached;

    const fresh = await fetcher();
    await this.set(key, fresh, options);
    return fresh;
  }

  // Invalidation - single key or pattern
  async invalidate(key: string, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.buildKey(key, options.namespace);
    await this.redis.del(fullKey);
  }

  async invalidatePattern(pattern: string, namespace?: CacheNamespace): Promise<void> {
    const fullPattern = namespace ? `${namespace}:${pattern}` : pattern;
    const keys = await this.redis.keys(fullPattern);
    await Promise.all(keys.map((k) => this.redis.del(k)));
  }

  //Rate limiting

  async rateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const key = this.buildKey(identifier, "rate");
    const current = await this.redis.incr(key);

    if (current === null) {
      return {
        allowed: false,
        remaining: 0,
      };
    }

    if (current === 1) {
      await this.redis.setex(key, windowSeconds, String(current));
    }

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  }

  //Pub/Sub
  async subscribe(
    channel: string,
    handler: (message: unknown, channel: string) => void
  ): Promise<void> {
    await this.redis.subscribe(channel, (raw, ch) => {
      try {
        handler(JSON.parse(raw), ch);
      } catch {
        handler(raw, ch);
      }
    });
  }
}

export default CacheManager;

// Export singleton instance for easy use in services
export const cacheManager = CacheManager.getInstance();