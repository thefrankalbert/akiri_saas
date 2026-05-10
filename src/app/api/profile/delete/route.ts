import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { verifyOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/api/rate-limit';

export async function DELETE(request: NextRequest) {
  const csrfError = verifyOrigin(request);
  if (csrfError) return csrfError;

  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  const limit = await rateLimit(`profile-delete:${user.id}`, { maxRequests: 3, windowMs: 60_000 });
  if (!limit.success) return apiError('Trop de tentatives, réessayez plus tard', 429);

  const adminSupabase = await createAdminClient();

  // Anonymize PII in profile (keep row for financial records)
  await adminSupabase
    .from('profiles')
    .update({
      first_name: '[supprimé]',
      last_name: '[supprimé]',
      phone: null,
      bio: null,
      avatar_url: null,
    })
    .eq('user_id', user.id);

  // Delete notifications
  await adminSupabase.from('notifications').delete().eq('user_id', user.id);

  // Delete push subscriptions
  await adminSupabase.from('push_subscriptions').delete().eq('user_id', user.id);

  // Delete auth account (this will trigger cascading deletes where configured)
  await adminSupabase.auth.admin.deleteUser(user.id);

  return apiSuccess({ message: 'Compte supprimé avec succès' });
}
