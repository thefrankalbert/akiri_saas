import { NextRequest } from 'next/server';
import { getAuthUser, apiError, apiSuccess } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Derive extension from MIME type, not from user-supplied filename
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// Magic bytes signatures for image validation
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP starts with RIFF....WEBP)
};

/**
 * Validate that the file's actual bytes match the declared MIME type.
 * Prevents uploading a malicious file disguised as an image.
 */
async function validateMagicBytes(file: File, mimeType: string): Promise<boolean> {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;

  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const signature of signatures) {
    const matches = signature.every((byte, index) => bytes[index] === byte);
    if (matches) {
      // Extra check for WebP: bytes 8-11 must be "WEBP"
      if (mimeType === 'image/webp') {
        return bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
      }
      return true;
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError('Non autoris\u00e9', 401);

  const formData = await request.formData();
  const file = formData.get('avatar');

  if (!file || !(file instanceof File)) {
    return apiError('Aucun fichier fourni', 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError('Format non support\u00e9. Utilisez JPEG, PNG ou WebP.', 400);
  }

  if (file.size > MAX_SIZE) {
    return apiError('Le fichier ne doit pas d\u00e9passer 5 Mo.', 400);
  }

  // Derive extension from MIME type (not from filename to prevent spoofing)
  const ext = MIME_TO_EXT[file.type];
  if (!ext) {
    return apiError('Type de fichier non autoris\u00e9', 400);
  }

  // Validate actual file content matches declared MIME type
  const isValidContent = await validateMagicBytes(file, file.type);
  if (!isValidContent) {
    return apiError('Le contenu du fichier ne correspond pas au type d\u00e9clar\u00e9', 400);
  }

  const supabase = await createClient();

  const filePath = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return apiError('Erreur lors du t\u00e9l\u00e9chargement', 500);
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

  const avatarUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  if (updateError) {
    return apiError('Erreur lors de la mise \u00e0 jour du profil', 500);
  }

  return apiSuccess({ avatar_url: avatarUrl });
}
