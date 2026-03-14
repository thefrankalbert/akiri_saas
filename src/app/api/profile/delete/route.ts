import { createAdminClient } from '@/lib/supabase/server';
import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';

export async function DELETE() {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

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
