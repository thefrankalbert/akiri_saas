import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, listTransactions } from '@/lib/services/admin';

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
  const result = await listTransactions(page);
  return NextResponse.json(result, { status: result.status });
}
