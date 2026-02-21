'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

interface SheetOverlayProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> {
  className?: string;
}

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  SheetOverlayProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} className={cn('fixed inset-0 z-50', className)} {...props} />
));
SheetOverlay.displayName = 'SheetOverlay';

type SheetSide = 'top' | 'bottom' | 'left' | 'right';

const slideVariants = {
  top: {
    initial: { y: '-100%' },
    animate: { y: 0 },
    exit: { y: '-100%' },
  },
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
  },
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
  },
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
  },
};

const sideStyles: Record<SheetSide, string> = {
  top: 'inset-x-0 top-0 border-b border-white/[0.08]',
  bottom: 'inset-x-0 bottom-0 border-t border-white/[0.08]',
  left: 'inset-y-0 left-0 h-full w-3/4 border-r border-white/[0.08] sm:max-w-sm',
  right: 'inset-y-0 right-0 h-full w-3/4 border-l border-white/[0.08] sm:max-w-sm',
};

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: SheetSide;
  className?: string;
  children: React.ReactNode;
  showClose?: boolean;
}

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, showClose = true, ...props }, ref) => {
  const variants = slideVariants[side];

  return (
    <SheetPortal>
      <SheetOverlay asChild>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-black/60 backdrop-blur-md"
        />
      </SheetOverlay>
      <DialogPrimitive.Content ref={ref} asChild {...props}>
        <motion.div
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn('bg-surface-800 fixed z-50 gap-4 p-6', sideStyles[side], className)}
        >
          {side === 'bottom' && (
            <div className="bg-surface-400 mx-auto mt-2 mb-4 h-1 w-10 rounded-full" />
          )}
          {children}
          {showClose && (
            <SheetClose className="text-surface-200 hover:bg-surface-700 focus:ring-primary-500 focus:ring-offset-surface-800 absolute top-4 right-4 rounded-lg p-1.5 transition-all hover:text-neutral-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
              <X size={20} />
              <span className="sr-only">Fermer</span>
            </SheetClose>
          )}
        </motion.div>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = 'SheetContent';

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-2 pb-4', className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold text-neutral-100', className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn('text-surface-100 text-sm', className)} {...props} />
  );
}

// Animated wrapper for Sheet that handles AnimatePresence
function AnimatedSheet({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <AnimatePresence mode="wait">{open && children}</AnimatePresence>
    </Sheet>
  );
}

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  AnimatedSheet,
};
