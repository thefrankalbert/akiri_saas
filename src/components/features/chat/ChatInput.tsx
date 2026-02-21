'use client';

import { useCallback, useRef, useState } from 'react';
import { ImageSquare, PaperPlaneRight, CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (content: string, contentType?: 'text' | 'image', mediaUrl?: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  conversationId: string;
}

export function ChatInput({ onSendMessage, onTyping, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed, 'text');
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, disabled, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    onTyping?.();
  }, [onTyping]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || disabled) return;

      // Client-side validation
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(file.type)) return;
      if (file.size > 5 * 1024 * 1024) return;

      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversation_id', 'temp'); // Will be validated server-side

        const res = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          onSendMessage(json.data.url, 'image', json.data.url);
        }
      } catch {
        // Silently fail — user can retry
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [disabled, onSendMessage]
  );

  return (
    <div className="border-t border-white/[0.06] p-3">
      <div className="flex items-end gap-2">
        {/* Attach image */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="text-surface-200 hover:text-primary-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <CircleNotch size={20} className="animate-spin" />
          ) : (
            <ImageSquare size={20} />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ecrivez un message..."
          disabled={disabled}
          rows={1}
          className={cn(
            'bg-surface-700 placeholder:text-surface-200 flex-1 resize-none rounded-2xl border border-white/[0.08] px-4 py-2.5 text-sm text-neutral-100',
            'focus:border-primary-500 focus:ring-primary-500 focus:ring-1 focus:outline-none',
            'disabled:opacity-50'
          )}
        />

        {/* Send */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="bg-primary-500 hover:bg-primary-600 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-colors disabled:opacity-50"
        >
          <PaperPlaneRight size={16} weight="fill" />
        </button>
      </div>
    </div>
  );
}
