import { NextRequest } from 'next/server';
import {
  getAuthUser,
  apiError,
  apiSuccess,
  parseBody,
  withServiceHandler,
} from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createProfilesService } from '@/lib/services/profiles';
import { updateProfileSchema } from '@/lib/validations';

export async function GET() {
  return withServiceHandler('GET /api/profile', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const supabase = await createClient();
    const service = createProfilesService(supabase);
    const data = await service.getProfileByUserId(user.id);
    return apiSuccess(data);
  });
}

export async function PATCH(request: NextRequest) {
  return withServiceHandler('PATCH /api/profile', async () => {
    const user = await getAuthUser();
    if (!user) return apiError('Non autorisé', 401);

    const body = await parseBody(request, updateProfileSchema);
    if (!body) return apiError('Données invalides', 400);

    const supabase = await createClient();
    const service = createProfilesService(supabase);
    const data = await service.updateProfile(user.id, body);
    return apiSuccess(data);
  });
}
