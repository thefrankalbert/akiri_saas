import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autorisé', 401);

  const formData = await request.formData();
  const file = formData.get('avatar');

  if (!file || !(file instanceof File)) {
    return apiError('Aucun fichier fourni', 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError('Format non supporté. Utilisez JPEG, PNG ou WebP.', 400);
  }

  if (file.size > MAX_SIZE) {
    return apiError('Le fichier ne doit pas dépasser 5 Mo.', 400);
  }

  const supabase = await createClient();

  const ext = file.name.split('.').pop() || 'jpg';
  const filePath = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return apiError('Erreur lors du téléchargement', 500);
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

  const avatarUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (updateError) {
    return apiError('Erreur lors de la mise à jour du profil', 500);
  }

  return apiSuccess({ avatar_url: avatarUrl });
}
