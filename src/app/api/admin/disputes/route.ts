import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, listDisputes } from '@/lib/services/admin';
import { resolveDispute } from '@/lib/services/requests';

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const result = await listDisputes(page);
  return NextResponse.json(result, { status: result.status });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await request.json();
  const { request_id, resolution } = body;

  if (!request_id || !['refund', 'release'].includes(resolution)) {
    return NextResponse.json(
      { error: 'request_id et resolution (refund|release) requis' },
      { status: 400 }
    );
  }

  const result = await resolveDispute(request_id, admin.user_id, resolution);
  return NextResponse.json(result, { status: result.status });
}
