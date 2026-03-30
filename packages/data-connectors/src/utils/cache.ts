import type Redis from 'ioredis';

export class RedisCache {
  constructor(private redis: Redis | null = null) {}

  setClient(redis: Redis): void {
    this.redis = redis;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.redis) return;
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(key);
  }

  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetchFn();
    await this.set(key, data, ttlSeconds);
    return data;
  }
}

export const cache = new RedisCache();
