'use client';

import { useRef } from 'react';
import { Camera, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { MAX_PARCEL_PHOTOS } from '@/constants';

interface PhotoUploadProps {
  photos: string[];
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  uploading?: boolean;
  error?: string;
  className?: string;
}

export function PhotoUpload({
  photos,
  onAdd,
  onRemove,
  uploading = false,
  error,
  className,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAdd(file);
      e.target.value = '';
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {photos.map((url, i) => (
          <div key={i} className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X size={10} weight="bold" />
            </button>
          </div>
        ))}

        {photos.length < MAX_PARCEL_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'bg-surface-700 hover:border-primary-500/30 hover:bg-surface-600 flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.12] transition-colors',
              uploading && 'animate-pulse cursor-wait'
            )}
          >
            <Camera weight="duotone" size={18} className="text-surface-200" />
            <span className="text-surface-200 mt-0.5 text-[9px]">
              {uploading ? '...' : 'Photo'}
            </span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />
      </div>
      {error && <p className="text-error mt-1 text-xs">{error}</p>}
    </div>
  );
}
