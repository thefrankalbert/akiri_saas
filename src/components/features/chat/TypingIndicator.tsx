'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface TypingIndicatorProps {
  typingUsers: string[];
  profilesMap: Record<string, { first_name: string }>;
}

export function TypingIndicator({ typingUsers, profilesMap }: TypingIndicatorProps) {
  return (
    <AnimatePresence>
      {typingUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-1"
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="bg-surface-200 h-1.5 w-1.5 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
            <span className="text-surface-200 text-xs">
              {typingUsers.map((id) => profilesMap[id]?.first_name || "Quelqu'un").join(', ')}{' '}
              ecrit...
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
