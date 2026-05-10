import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPushService } from '@/lib/services/push';
import { withServiceHandler } from '@/lib/api/helpers';
import { verifyOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/api/rate-limit';

export async function POST(request: NextRequest) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  return withServiceHandler('POST /api/notifications/subscribe', async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const limit = await rateLimit(`push-subscribe:${user.id}`, {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!limit.success) return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 });

    const body = await request.json();
    const { subscription } = body;

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 });
    }

    const adminSupabase = await createAdminClient();
    const service = createPushService(adminSupabase);
    await service.saveSubscription(user.id, subscription);

    return NextResponse.json({ success: true });
  });
}

export async function DELETE(request: NextRequest) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  return withServiceHandler('DELETE /api/notifications/subscribe', async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const limit = await rateLimit(`push-unsubscribe:${user.id}`, {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!limit.success) return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 });

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint requis' }, { status: 400 });
    }

    const adminSupabase = await createAdminClient();
    const service = createPushService(adminSupabase);
    await service.removeSubscription(user.id, endpoint);
    return NextResponse.json({ success: true });
  });
}
