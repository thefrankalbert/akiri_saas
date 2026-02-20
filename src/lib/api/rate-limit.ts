// ============================================
// In-memory Rate Limiter — Serverless compatible
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterMs: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 60s to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now >= entry.resetTime) {
      store.delete(key);
    }
  }
}

export function rateLimit(
  key: string,
  { maxRequests, windowMs }: RateLimitOptions
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // Window expired or first request — start fresh
  if (!entry || now >= entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  // Within window
  entry.count++;

  if (entry.count > maxRequests) {
    return {
      success: false,
      remaining: 0,
      retryAfterMs: entry.resetTime - now,
    };
  }

  return {
    success: true,
    remaining: maxRequests - entry.count,
    retryAfterMs: 0,
  };
}
