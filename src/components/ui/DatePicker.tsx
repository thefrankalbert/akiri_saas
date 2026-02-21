'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';
import { CalendarBlank } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string;
  onChange?: (date: string | null) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  minDate?: Date;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  error,
  placeholder = 'Choisir une date',
  minDate = new Date(),
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value) : undefined;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleSelect = (
    day: Date | undefined,
    _triggerDate: Date,
    _modifiers: Record<string, boolean>,
    _e: React.MouseEvent | React.KeyboardEvent
  ) => {
    if (day) {
      onChange?.(day.toISOString());
    } else {
      onChange?.(null);
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      {label && <label className="text-surface-50 mb-1.5 block text-sm font-medium">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'bg-surface-700 flex h-10 w-full items-center gap-2 rounded-xl border px-3 text-sm transition-colors',
          error ? 'border-error' : 'focus:border-primary-500 border-white/[0.08]',
          disabled && 'cursor-not-allowed opacity-50',
          selected ? 'text-neutral-100' : 'text-surface-200'
        )}
      >
        <CalendarBlank weight="duotone" size={16} className="text-surface-200 shrink-0" />
        {selected ? format(selected, 'd MMMM yyyy', { locale: fr }) : placeholder}
      </button>

      {open && (
        <div className="bg-surface-800 absolute top-full z-50 mt-1 rounded-xl border border-white/[0.08] p-3 shadow-xl">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            locale={fr}
            disabled={{ before: minDate }}
            classNames={{
              root: 'text-neutral-100',
              months: 'flex flex-col',
              month: 'space-y-2',
              month_caption: 'flex justify-center py-1 text-sm font-medium',
              nav: 'flex items-center justify-between absolute top-3 left-3 right-3',
              button_previous:
                'text-surface-200 hover:text-neutral-100 h-7 w-7 flex items-center justify-center rounded-lg hover:bg-surface-700',
              button_next:
                'text-surface-200 hover:text-neutral-100 h-7 w-7 flex items-center justify-center rounded-lg hover:bg-surface-700',
              weekdays: 'flex',
              weekday: 'text-surface-200 w-9 text-center text-xs font-medium',
              week: 'flex',
              day: 'h-9 w-9 text-center text-sm',
              day_button: 'h-9 w-9 rounded-lg transition-colors hover:bg-surface-600',
              selected: 'bg-primary-500 text-white hover:bg-primary-600 rounded-lg',
              today: 'font-bold text-primary-400',
              disabled: 'text-surface-400 opacity-50 cursor-not-allowed',
              outside: 'text-surface-400 opacity-30',
            }}
          />
        </div>
      )}

      {error && <p className="text-error mt-1 text-xs">{error}</p>}
    </div>
  );
}
