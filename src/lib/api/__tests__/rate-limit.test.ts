// src/lib/api/__tests__/rate-limit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@upstash/redis', () => ({ Redis: vi.fn() }));
vi.mock('@upstash/ratelimit', () => ({ Ratelimit: vi.fn() }));

describe('rateLimitAsync', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('should allow requests under the limit (in-memory fallback)', async () => {
    const { rateLimitAsync } = await import('../rate-limit');
    const result = await rateLimitAsync('test-key-1', { maxRequests: 5, windowMs: 60000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('should block requests over the limit (in-memory fallback)', async () => {
    const { rateLimitAsync } = await import('../rate-limit');
    const key = 'test-key-block';
    for (let i = 0; i < 3; i++) {
      await rateLimitAsync(key, { maxRequests: 3, windowMs: 60000 });
    }
    const result = await rateLimitAsync(key, { maxRequests: 3, windowMs: 60000 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });
});
