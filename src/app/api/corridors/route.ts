import { apiSuccess } from '@/lib/api/helpers';
import { getCorridors } from '@/lib/services/corridors';

export async function GET() {
  const corridors = await getCorridors();
  return apiSuccess(corridors);
}
