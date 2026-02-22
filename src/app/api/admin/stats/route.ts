import { NextResponse } from 'next/server';
import { requireAdmin, getAdminStats } from '@/lib/services/admin';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const result = await getAdminStats();
  return NextResponse.json(result, { status: result.status });
}
