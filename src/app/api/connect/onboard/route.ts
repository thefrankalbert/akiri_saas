import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { createConnectOnboardingLink } from '@/lib/services/transactions';

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const result = await createConnectOnboardingLink(user.id);

  if (result.error) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}
