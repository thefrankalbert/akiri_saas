import { NextResponse } from 'next/server';
import { getAuthUser, apiError } from '@/lib/api/helpers';
import { createClient } from '@/lib/supabase/server';
import { validateImageUpload, getMimeExtension } from '@/lib/utils/upload-validation';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return apiError('Non autorisé', 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError('Données invalides', 400);
  }

  const file = formData.get('file') as File | null;
  const conversationId = formData.get('conversation_id') as string | null;

  if (!file || !conversationId) {
    return apiError('Fichier et conversation_id requis', 400);
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError('Type de fichier non supporté. Utilisez JPEG, PNG, WebP ou GIF.', 400);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return apiError('Fichier trop volumineux. Maximum 5 Mo.', 400);
  }

  const supabase = await createClient();

  // Verify user is participant in conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('participant_ids')
    .eq('id', conversationId)
    .single();

  if (!conversation || !conversation.participant_ids.includes(user.id)) {
    return apiError('Accès non autorisé à cette conversation', 403);
  }

  // Validate magic bytes match declared MIME type
  const isValid = await validateImageUpload(file, file.type);
  if (!isValid) {
    return apiError('Le contenu du fichier ne correspond pas au type déclaré', 400);
  }

  // Derive extension from MIME type (not from user-supplied filename)
  const ext = getMimeExtension(file.type);
  if (!ext) return apiError('Type de fichier non autorisé', 400);

  const filename = `${conversationId}/${crypto.randomUUID()}.${ext}`;

  // Upload to Supabase Storage
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('chat-media')
    .upload(filename, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return apiError('Erreur lors du téléchargement', 500);
  }

  // Get signed URL (valid for 1 year)
  const { data: urlData } = await supabase.storage
    .from('chat-media')
    .createSignedUrl(filename, 365 * 24 * 60 * 60);

  if (!urlData?.signedUrl) {
    return apiError('Erreur lors de la génération du lien', 500);
  }

  return NextResponse.json(
    { data: { url: urlData.signedUrl }, error: null, status: 201 },
    { status: 201 }
  );
}
