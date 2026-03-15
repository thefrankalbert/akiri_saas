import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess, withServiceHandler } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createProfilesService } from '@/lib/services/profiles';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  return withServiceHandler('GET /api/profile/[id]', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const { id } = await params;
    const supabase = await createClient();
    const service = createProfilesService(supabase);
    const data = await service.getProfileByUserId(id);
    return apiSuccess(data);
  });
}
