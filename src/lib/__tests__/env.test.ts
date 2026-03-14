import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('env validation', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('should export validateEnv function', async () => {
    const { validateEnv } = await import('../env');
    expect(typeof validateEnv).toBe('function');
  });

  it('should return valid when required vars are present', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');

    const { validateEnv } = await import('../env');
    const result = validateEnv();
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('should return missing vars list when required vars are absent', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

    const { validateEnv } = await import('../env');
    const result = validateEnv();
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it('should list optional vars as warnings', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');

    const { validateEnv } = await import('../env');
    const result = validateEnv();
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings).toContain('STRIPE_SECRET_KEY');
  });
});
