'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-xl bg-neutral-100 p-1',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all',
      'focus-visible:ring-primary-500 ring-offset-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm',
      'data-[state=inactive]:text-neutral-500 data-[state=inactive]:hover:text-neutral-700',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'focus-visible:ring-primary-500 mt-4 ring-offset-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// Animated Tabs with sliding indicator
interface AnimatedTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

function AnimatedTabs({ tabs, activeTab, onChange, className }: AnimatedTabsProps) {
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);

  return (
    <div
      className={cn(
        'relative inline-flex h-11 items-center rounded-xl bg-neutral-100 p-1',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isHovered = tab.id === hoveredTab;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            className={cn(
              'relative z-10 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              isActive ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            {tab.icon}
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 z-[-1] rounded-lg bg-white shadow-sm"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            {isHovered && !isActive && (
              <motion.div
                layoutId="hoveredTabIndicator"
                className="absolute inset-0 z-[-1] rounded-lg bg-neutral-200/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Underline variant
interface UnderlineTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode; count?: number }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

function UnderlineTabs({ tabs, activeTab, onChange, className }: UnderlineTabsProps) {
  return (
    <div className={cn('relative border-b border-neutral-200', className)}>
      <div className="flex gap-8">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative inline-flex items-center gap-2 pb-3 text-sm font-medium transition-colors',
                isActive ? 'text-primary-600' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs',
                    isActive ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="underlineIndicator"
                  className="bg-primary-600 absolute right-0 bottom-0 left-0 h-0.5"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, AnimatedTabs, UnderlineTabs };
