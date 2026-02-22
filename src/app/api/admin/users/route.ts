import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, listUsers, toggleUserBan } from '@/lib/services/admin';

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || undefined;

  const result = await listUsers(page, 20, search);
  return NextResponse.json(result, { status: result.status });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await request.json();
  const { user_id, action } = body;

  if (!user_id || !action) {
    return NextResponse.json({ error: 'user_id et action requis' }, { status: 400 });
  }

  if (action === 'ban' || action === 'unban') {
    const result = await toggleUserBan(user_id, action === 'ban');
    return NextResponse.json(result, { status: result.status });
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
