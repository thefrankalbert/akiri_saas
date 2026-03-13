import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createPushService } from '@/lib/services/push';
import { withServiceHandler } from '@/lib/api/helpers';

export async function POST(request: NextRequest) {
  return withServiceHandler('POST /api/notifications/subscribe', async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

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
  return withServiceHandler('DELETE /api/notifications/subscribe', async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

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
