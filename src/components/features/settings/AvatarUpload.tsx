'use client';

import { useRef, useState } from 'react';
import { Camera, SpinnerGap } from '@phosphor-icons/react';
import { Avatar } from '@/components/ui';
import { toasts } from '@/lib/utils/toast';
import { supabaseConfigured } from '@/lib/supabase/client';

interface AvatarUploadProps {
  currentUrl: string | null;
  firstName: string;
  lastName: string;
}

export function AvatarUpload({ currentUrl, firstName, lastName }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const displayUrl = previewUrl || currentUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toasts.validationError('Format accepté : JPEG, PNG ou WebP');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toasts.validationError('La photo ne doit pas dépasser 5 Mo');
      return;
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setUploading(true);

    if (!supabaseConfigured) {
      await new Promise((r) => setTimeout(r, 1000));
      setUploading(false);
      toasts.avatarUpdated();
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json();
        toasts.genericError(json.error);
        setPreviewUrl(null);
        return;
      }

      toasts.avatarUpdated();
    } catch {
      toasts.genericError();
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      className="group relative"
      disabled={uploading}
    >
      <Avatar src={displayUrl} firstName={firstName} lastName={lastName} size="xl" />

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/40">
        {uploading ? (
          <SpinnerGap weight="bold" size={24} className="animate-spin text-white" />
        ) : (
          <Camera
            weight="duotone"
            size={24}
            className="text-white opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </button>
  );
}
