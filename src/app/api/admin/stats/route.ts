import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createAdminService(supabase, adminSupabase);

    const admin = await service.requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const data = await service.getAdminStats();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: serviceErrorToStatus(error.code) }
      );
    }
    logger.error('GET /api/admin/stats', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
