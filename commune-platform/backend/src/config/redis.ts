import Redis from 'ioredis';
import { config } from './env';

// ============================================================
// REDIS CONFIGURATION
// Connection, pub/sub, caching layer
// ============================================================

// Redis client for general operations
export const redis = new Redis(config.database.redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

// Redis client for pub/sub (separate connection)
export const redisPub = new Redis(config.database.redisUrl);
export const redisSub = new Redis(config.database.redisUrl);

// Connection events
redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (error) => {
  console.error('❌ Redis error:', error);
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Connect to Redis
export async function connectRedis(): Promise<void> {
  await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  await redisPub.quit();
  await redisSub.quit();
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// CACHE UTILITIES
// ============================================================

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Get value from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

/**
 * Set value in cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL
): Promise<void> {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  await redis.setex(key, ttlSeconds, serialized);
}

/**
 * Delete value from cache
 */
export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}

/**
 * Delete multiple keys by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

/**
 * Increment counter
 */
export async function incrementCounter(key: string, amount: number = 1): Promise<number> {
  return redis.incrby(key, amount);
}

/**
 * Set expiry on key
 */
export async function expireKey(key: string, seconds: number): Promise<void> {
  await redis.expire(key, seconds);
}

// ============================================================
// PRESENCE MANAGEMENT
// ============================================================

const PRESENCE_TTL = 300; // 5 minutes
const PRESENCE_KEY_PREFIX = 'presence:';
const ONLINE_USERS_KEY = 'online_users';

/**
 * Update user presence
 */
export async function updatePresence(
  userId: bigint,
  status: string,
  customStatus?: string
): Promise<void> {
  const key = `${PRESENCE_KEY_PREFIX}${userId}`;
  const presence = {
    status,
    customStatus: customStatus || null,
    lastSeenAt: new Date().toISOString(),
  };
  
  await redis.setex(key, PRESENCE_TTL, JSON.stringify(presence));
  
  if (status !== 'offline') {
    await redis.zadd(ONLINE_USERS_KEY, Date.now(), userId.toString());
  } else {
    await redis.zrem(ONLINE_USERS_KEY, userId.toString());
  }
}

/**
 * Get user presence
 */
export async function getPresence(userId: bigint): Promise<{
  status: string;
  customStatus?: string;
  lastSeenAt: string;
} | null> {
  const key = `${PRESENCE_KEY_PREFIX}${userId}`;
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

/**
 * Get multiple user presences
 */
export async function getPresences(userIds: bigint[]): Promise<Map<string, any>> {
  const keys = userIds.map(id => `${PRESENCE_KEY_PREFIX}${id}`);
  const values = await redis.mget(...keys);
  
  const result = new Map();
  userIds.forEach((id, index) => {
    const value = values[index];
    if (value) {
      result.set(id.toString(), JSON.parse(value));
    }
  });
  
  return result;
}

/**
 * Get online users count
 */
export async function getOnlineCount(): Promise<number> {
  // Remove stale entries
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  await redis.zremrangebyscore(ONLINE_USERS_KEY, 0, fiveMinutesAgo);
  
  return redis.zcard(ONLINE_USERS_KEY);
}

// ============================================================
// TYPING INDICATORS
// ============================================================

const TYPING_TTL = 10; // 10 seconds

/**
 * Set user typing in channel
 */
export async function setTyping(channelId: bigint, userId: bigint): Promise<void> {
  const key = `typing:${channelId}`;
  await redis.hset(key, userId.toString(), Date.now().toString());
  await redis.expire(key, TYPING_TTL);
}

/**
 * Get typing users in channel
 */
export async function getTypingUsers(channelId: bigint): Promise<bigint[]> {
  const key = `typing:${channelId}`;
  const users = await redis.hgetall(key);
  
  const now = Date.now();
  const typingUsers: bigint[] = [];
  
  for (const [userId, timestamp] of Object.entries(users)) {
    if (now - parseInt(timestamp) < TYPING_TTL * 1000) {
      typingUsers.push(BigInt(userId));
    }
  }
  
  return typingUsers;
}

// ============================================================
// RATE LIMITING
// ============================================================

/**
 * Check rate limit
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = Math.floor(now / windowSeconds);
  const fullKey = `ratelimit:${key}:${windowKey}`;
  
  const current = await redis.incr(fullKey);
  if (current === 1) {
    await redis.expire(fullKey, windowSeconds);
  }
  
  const allowed = current <= maxRequests;
  const remaining = Math.max(0, maxRequests - current);
  const resetAt = (windowKey + 1) * windowSeconds;
  
  return { allowed, remaining, resetAt };
}

// ============================================================
// WEBSOCKET SESSION MANAGEMENT
// ============================================================

const WS_SESSION_PREFIX = 'ws:session:';
const WS_USER_PREFIX = 'ws:user:';

/**
 * Register WebSocket connection
 */
export async function registerWebSocket(
  sessionId: string,
  userId: bigint,
  socketId: string
): Promise<void> {
  await redis.sadd(`${WS_USER_PREFIX}${userId}`, socketId);
  await redis.setex(`${WS_SESSION_PREFIX}${socketId}`, 3600, userId.toString());
}

/**
 * Unregister WebSocket connection
 */
export async function unregisterWebSocket(
  userId: bigint,
  socketId: string
): Promise<void> {
  await redis.srem(`${WS_USER_PREFIX}${userId}`, socketId);
  await redis.del(`${WS_SESSION_PREFIX}${socketId}`);
}

/**
 * Get user's socket IDs
 */
export async function getUserSockets(userId: bigint): Promise<string[]> {
  return redis.smembers(`${WS_USER_PREFIX}${userId}`);
}

/**
 * Check if user has active connections
 */
export async function hasActiveConnections(userId: bigint): Promise<boolean> {
  const count = await redis.scard(`${WS_USER_PREFIX}${userId}`);
  return count > 0;
}

// ============================================================
// MESSAGE CACHING
// ============================================================

const MESSAGE_CACHE_PREFIX = 'channel:messages:';
const MESSAGE_CACHE_TTL = 3600; // 1 hour
const MESSAGE_CACHE_LIMIT = 100;

/**
 * Cache recent messages for a channel
 */
export async function cacheMessage(channelId: bigint, message: any): Promise<void> {
  const key = `${MESSAGE_CACHE_PREFIX}${channelId}`;
  await redis.lpush(key, JSON.stringify(message));
  await redis.ltrim(key, 0, MESSAGE_CACHE_LIMIT - 1);
  await redis.expire(key, MESSAGE_CACHE_TTL);
}

/**
 * Get cached messages for a channel
 */
export async function getCachedMessages(channelId: bigint, limit: number = 50): Promise<any[]> {
  const key = `${MESSAGE_CACHE_PREFIX}${channelId}`;
  const messages = await redis.lrange(key, 0, limit - 1);
  return messages.map(m => JSON.parse(m));
}

/**
 * Invalidate message cache
 */
export async function invalidateMessageCache(channelId: bigint): Promise<void> {
  await redis.del(`${MESSAGE_CACHE_PREFIX}${channelId}`);
}

// ============================================================
// PUB/SUB FOR CROSS-SERVER COMMUNICATION
// ============================================================

export const CHANNELS = {
  GATEWAY_EVENTS: 'gateway:events',
  PRESENCE_UPDATES: 'presence:updates',
  MESSAGE_BROADCAST: 'message:broadcast',
  VOICE_SIGNALING: 'voice:signaling',
  NOTIFICATIONS: 'notifications',
} as const;

/**
 * Publish event to all servers
 */
export async function publishEvent(channel: string, data: any): Promise<void> {
  await redisPub.publish(channel, JSON.stringify(data));
}

/**
 * Subscribe to events
 */
export function subscribeToChannel(
  channel: string,
  handler: (data: any) => void
): void {
  redisSub.subscribe(channel);
  redisSub.on('message', (receivedChannel, message) => {
    if (receivedChannel === channel) {
      try {
        handler(JSON.parse(message));
      } catch (error) {
        console.error('Error handling pub/sub message:', error);
      }
    }
  });
}
