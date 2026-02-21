'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TypeToggleOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface TypeToggleProps {
  options: TypeToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TypeToggle({ options, value, onChange, className }: TypeToggleProps) {
  const selectedIndex = options.findIndex((o) => o.value === value);

  return (
    <div
      className={cn(
        'bg-surface-700 relative flex rounded-xl border border-white/[0.08] p-1',
        className
      )}
    >
      {/* Sliding background */}
      <motion.div
        className="bg-primary-500 absolute top-1 bottom-1 rounded-lg"
        initial={false}
        animate={{
          left: `calc(${(selectedIndex / options.length) * 100}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />

      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors',
            value === option.value ? 'text-white' : 'text-surface-200 hover:text-neutral-100'
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
