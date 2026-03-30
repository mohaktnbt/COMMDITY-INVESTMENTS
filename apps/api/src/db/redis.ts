/**
 * Redis client using ioredis. Exports main instance and pub/sub clients.
 */
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

/** Main Redis client for reads/writes and caching. */
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5_000);
    return delay;
  },
  lazyConnect: true,
});

/** Dedicated Redis client for Pub/Sub subscriptions. */
export const redisSub = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5_000);
    return delay;
  },
  lazyConnect: true,
});

/** Dedicated Redis client for publishing. */
export const redisPub = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5_000);
    return delay;
  },
  lazyConnect: true,
});

redis.on('error', (err) => console.error('Redis client error:', err));
redisSub.on('error', (err) => console.error('Redis sub error:', err));
redisPub.on('error', (err) => console.error('Redis pub error:', err));
