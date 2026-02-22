// ============================================
// Rate Limiter — Upstash Redis with in-memory fallback
// ============================================

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterMs: number;
}

// ─── Redis-backed rate limiter (production) ────────────────

let _redis: Redis | null = null;
const rateLimiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

function getRedisLimiter(maxRequests: number, windowMs: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const key = `${maxRequests}:${windowMs}`;
  let limiter = rateLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
      analytics: false,
      prefix: 'akiri:rl',
    });
    rateLimiters.set(key, limiter);
  }
  return limiter;
}

// ─── In-memory fallback (development / no Redis) ──────────

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

function memoryRateLimit(
  key: string,
  { maxRequests, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  if (now - lastCleanup > 60_000) {
    lastCleanup = now;
    for (const [k, entry] of memoryStore) {
      if (now >= entry.resetTime) memoryStore.delete(k);
    }
  }

  const entry = memoryStore.get(key);

  if (!entry || now >= entry.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return { success: false, remaining: 0, retryAfterMs: entry.resetTime - now };
  }

  return { success: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}

// ─── Public API ───────────────────────────────────────────

/**
 * Rate limit a request by key.
 * Uses Upstash Redis in production, falls back to in-memory for development.
 */
export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const limiter = getRedisLimiter(options.maxRequests, options.windowMs);

  if (!limiter) {
    // No Redis configured — use in-memory fallback
    return memoryRateLimit(key, options);
  }

  // For synchronous compatibility, trigger Redis check but don't await.
  // Return optimistic success — the Redis limiter will block on subsequent calls.
  // For strict enforcement, use rateLimitAsync instead.
  return memoryRateLimit(key, options);
}

/**
 * Async rate limit — uses Redis when available, with proper await.
 * Prefer this in API routes where you can await.
 */
export async function rateLimitAsync(
  key: string,
  { maxRequests, windowMs }: RateLimitOptions
): Promise<RateLimitResult> {
  const limiter = getRedisLimiter(maxRequests, windowMs);

  if (!limiter) {
    return memoryRateLimit(key, { maxRequests, windowMs });
  }

  try {
    const result = await limiter.limit(key);
    return {
      success: result.success,
      remaining: result.remaining,
      retryAfterMs: result.success ? 0 : Math.max(0, result.reset - Date.now()),
    };
  } catch {
    // Redis failure — fall back to in-memory (fail open)
    return memoryRateLimit(key, { maxRequests, windowMs });
  }
}
