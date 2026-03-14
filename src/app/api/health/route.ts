import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Check Supabase
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    checks.supabase = error ? 'error' : 'ok';
  } catch {
    checks.supabase = 'error';
  }

  // Check Stripe
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    checks.stripe = stripeKey ? 'ok' : 'error';
  } catch {
    checks.stripe = 'error';
  }

  // Check Resend
  checks.resend = process.env.RESEND_API_KEY ? 'ok' : 'error';

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
