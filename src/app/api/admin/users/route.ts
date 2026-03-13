import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createAdminService } from '@/lib/services/admin';
import { ServiceError, serviceErrorToStatus } from '@/lib/services/errors';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createAdminService(supabase, adminSupabase);

    const admin = await service.requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || undefined;

    const data = await service.listUsers(page, 20, search);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: serviceErrorToStatus(error.code) }
      );
    }
    logger.error('GET /api/admin/users', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const service = createAdminService(supabase, adminSupabase);

    const admin = await service.requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, action } = body;

    if (!user_id || !action) {
      return NextResponse.json({ error: 'user_id et action requis' }, { status: 400 });
    }

    if (action === 'ban' || action === 'unban') {
      const data = await service.toggleUserBan(user_id, action === 'ban');
      return NextResponse.json({ data }, { status: 200 });
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: serviceErrorToStatus(error.code) }
      );
    }
    logger.error('PATCH /api/admin/users', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
