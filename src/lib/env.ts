const REQUIRED_ENV_VARS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;

const REQUIRED_SERVER_ENV_VARS = ['SUPABASE_SERVICE_ROLE_KEY'] as const;

const OPTIONAL_ENV_VARS = [
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_POSTHOG_KEY',
] as const;

export function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (typeof window === 'undefined') {
    for (const key of REQUIRED_SERVER_ENV_VARS) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  }

  for (const key of OPTIONAL_ENV_VARS) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  return { valid: missing.length === 0, missing, warnings };
}

if (process.env.NEXT_PUBLIC_APP_ENV !== 'production' && typeof window === 'undefined') {
  const result = validateEnv();
  if (result.warnings.length > 0) {
    console.warn('[env] Optional vars not set:', result.warnings.join(', '));
  }
  if (!result.valid) {
    console.error('[env] Required vars missing:', result.missing.join(', '));
  }
}
