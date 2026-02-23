// ============================================
// Upload Validation — Shared magic byte + MIME helpers
// ============================================

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
};

/**
 * Validate that a file's actual bytes match the declared MIME type.
 */
export async function validateImageUpload(file: File, mimeType: string): Promise<boolean> {
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

/**
 * Get the file extension for a given MIME type.
 */
export function getMimeExtension(mimeType: string): string | null {
  return MIME_TO_EXT[mimeType] || null;
}
