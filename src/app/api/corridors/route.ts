import { apiSuccess, withServiceHandler } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { createCorridorsService } from '@/lib/services/corridors';

export async function GET() {
  return withServiceHandler('GET /api/corridors', async () => {
    const supabase = await createClient();
    const service = createCorridorsService(supabase);
    const data = await service.getCorridors();
    return apiSuccess(data);
  });
}
