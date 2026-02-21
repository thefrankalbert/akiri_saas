'use client';

import { Check, Checks } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui';
import { cn, formatMessageTime } from '@/lib/utils';
import type { Message, Profile } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderProfile?: Profile;
  showAvatar?: boolean;
  onImageClick?: (url: string) => void;
}

export function MessageBubble({
  message,
  isOwn,
  senderProfile,
  showAvatar = true,
  onImageClick,
}: MessageBubbleProps) {
  // System message
  if (message.content_type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center py-1"
      >
        <span className="text-surface-200 rounded-full bg-white/[0.04] px-3 py-1 text-[11px]">
          {message.content}
        </span>
      </motion.div>
    );
  }

  // Image message
  if (message.content_type === 'image' && message.media_url) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}
      >
        {!isOwn && showAvatar && senderProfile ? (
          <Avatar
            firstName={senderProfile.first_name}
            lastName={senderProfile.last_name}
            size="sm"
          />
        ) : !isOwn && showAvatar ? (
          <div className="w-8" />
        ) : null}
        <div className="max-w-[min(280px,75%)]">
          <button
            onClick={() => onImageClick?.(message.media_url!)}
            className="overflow-hidden rounded-2xl transition-opacity hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.media_url}
              alt="Image partagée"
              className="h-auto w-full object-cover"
            />
          </button>
          <div
            className={cn('mt-1 flex items-center gap-1', isOwn ? 'justify-end' : 'justify-start')}
          >
            <span className="text-surface-200 text-[10px]">
              {formatMessageTime(message.created_at)}
            </span>
            {isOwn &&
              (message.is_read ? (
                <Checks size={12} className="text-primary-400" />
              ) : (
                <Check size={12} className="text-surface-200" />
              ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Text message
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}
    >
      {!isOwn && showAvatar && senderProfile ? (
        <Avatar firstName={senderProfile.first_name} lastName={senderProfile.last_name} size="sm" />
      ) : !isOwn && showAvatar ? (
        <div className="w-8" />
      ) : null}
      <div
        className={cn(
          'max-w-[80%] px-4 py-2.5',
          isOwn
            ? 'bg-primary-600 rounded-2xl rounded-br-sm text-white'
            : 'bg-surface-700 rounded-2xl rounded-bl-sm text-neutral-100'
        )}
      >
        <p className="text-sm leading-relaxed break-words">{message.content}</p>
        <div
          className={cn('mt-1 flex items-center gap-1', isOwn ? 'justify-end' : 'justify-start')}
        >
          <span className={cn('text-[10px]', isOwn ? 'text-primary-200' : 'text-surface-200')}>
            {formatMessageTime(message.created_at)}
          </span>
          {isOwn &&
            (message.is_read ? (
              <Checks size={12} className="text-primary-200" />
            ) : (
              <Check size={12} className={isOwn ? 'text-primary-200' : 'text-surface-200'} />
            ))}
        </div>
      </div>
    </motion.div>
  );
}
