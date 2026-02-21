import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError('Donn\u00e9es invalides', 400);
  }

  const file = formData.get('file') as File | null;

  if (!file) return apiError('Fichier requis', 400);

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError('Type de fichier non support\u00e9. Utilisez JPEG, PNG ou WebP.', 400);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return apiError('Fichier trop volumineux. Maximum 5 Mo.', 400);
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createClient();

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('parcel-photos')
    .upload(fileName, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return apiError('Erreur lors du t\u00e9l\u00e9chargement', 500);

  const { data: urlData } = supabase.storage.from('parcel-photos').getPublicUrl(fileName);

  return apiSuccess({ url: urlData.publicUrl }, 201);
}
