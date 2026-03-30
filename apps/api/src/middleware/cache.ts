/**
 * Redis cache middleware stub.
 * TODO: Integrate with Redis for response caching.
 */
import type { Request, Response, NextFunction } from 'express';

export interface CacheOptions {
  /** TTL in seconds. Default: 60. */
  ttlSeconds?: number;
  /** Key prefix for cache entries. */
  prefix?: string;
}

/**
 * Cache middleware - currently passes through all requests.
 * TODO: Implement Redis-based response caching.
 *
 * When implemented, this will:
 * 1. Generate a cache key from the request URL and query params.
 * 2. Check Redis for a cached response.
 * 3. If found, return the cached response directly.
 * 4. If not found, intercept res.json() to store the response in Redis with TTL.
 */
export function cacheMiddleware(_options: CacheOptions = {}) {
  // const { ttlSeconds = 60, prefix = 'api-cache' } = options;

  return function cache(_req: Request, _res: Response, next: NextFunction): void {
    // TODO: Implement Redis caching
    // const key = `${prefix}:${req.originalUrl}`;
    // const cached = await redis.get(key);
    // if (cached) {
    //   res.setHeader('X-Cache', 'HIT');
    //   res.json(JSON.parse(cached));
    //   return;
    // }
    //
    // const originalJson = res.json.bind(res);
    // res.json = (body) => {
    //   redis.setex(key, ttlSeconds, JSON.stringify(body));
    //   res.setHeader('X-Cache', 'MISS');
    //   return originalJson(body);
    // };

    next();
  };
}
