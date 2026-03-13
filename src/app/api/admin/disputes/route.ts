import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, listDisputes } from '@/lib/services/admin';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createRequestService } from '@/lib/services/requests';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';

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
  try {
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

    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createRequestService(supabase, adminSupabase);
    const data = await service.resolveDispute(request_id, admin.user_id, resolution);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: serviceErrorToStatus(error.code) }
      );
    }
    logger.error('PATCH /api/admin/disputes', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
