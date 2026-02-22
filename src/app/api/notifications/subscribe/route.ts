import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { saveSubscription, removeSubscription } from '@/lib/services/push';

export async function POST(request: NextRequest) {
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

  const result = await saveSubscription(user.id, subscription);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
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

  await removeSubscription(user.id, endpoint);
  return NextResponse.json({ success: true });
}
