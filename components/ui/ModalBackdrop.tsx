'use client';

import React, { createContext, useContext, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const modalBackdropVariants = cva(
  'fixed inset-0 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none',
  {
    variants: {
      variant: {
        default: 'bg-black/50',
        light: 'bg-surface-950/40',
        dark: 'bg-surface-950/80',
        surface: 'bg-surface-900/60',
      },
      blur: {
        none: 'backdrop-blur-none',
        sm: 'backdrop-blur-sm',
        md: 'backdrop-blur-md',
        lg: 'backdrop-blur-lg',
      },
    },
    defaultVariants: { variant: 'default', blur: 'sm' },
  }
);

interface ModalLayerContextValue {
  zIndex: string | number;
  captureReturnFocus: () => void;
  restoreFocus: (event: Event) => void;
}

const ModalLayerContext = createContext<ModalLayerContextValue>({
  zIndex: 51,
  captureReturnFocus: () => undefined,
  restoreFocus: () => undefined,
});

export interface ModalBackdropProps extends VariantProps<typeof modalBackdropVariants> {
  isOpen: boolean;
  onClick?: () => void;
  zIndex?: string | number;
  preventScroll?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const ModalBackdrop = ({
  isOpen,
  onClick,
  zIndex = 50,
  preventScroll = true,
  className,
  children,
  variant,
  blur,
}: ModalBackdropProps) => {
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const contentZIndex =
    typeof zIndex === 'number' || !Number.isNaN(Number(zIndex)) ? Number(zIndex) + 1 : `calc(${zIndex} + 1)`;
  const layerContext: ModalLayerContextValue = {
    zIndex: contentZIndex,
    captureReturnFocus: () => {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
    },
    restoreFocus: event => {
      if (!returnFocusRef.current) return;
      event.preventDefault();
      returnFocusRef.current.focus();
      returnFocusRef.current = null;
    },
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={open => !open && onClick?.()} modal={preventScroll}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(modalBackdropVariants({ variant, blur }), className)}
          style={{ zIndex }}
        />
        <ModalLayerContext.Provider value={layerContext}>{children}</ModalLayerContext.Provider>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  position?: 'center' | 'top';
  /** Accessible fallback used when a consumer does not render ModalHeader. */
  accessibleTitle?: string;
}

function getModalTitle(children: React.ReactNode, fallback?: string) {
  if (fallback) return fallback;
  const header = React.Children.toArray(children).find(
    child => React.isValidElement(child) && child.type === ModalHeader
  );
  return React.isValidElement<ModalHeaderProps>(header) ? header.props.title : 'Dialog';
}

export const modalContentVariants = cva(
  'fixed overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl outline-none dark:border-surface-800 dark:bg-surface-900 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none',
  {
    variants: {
      maxWidth: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-full',
      },
      position: {
        center: 'top-1/2 start-1/2 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rtl:translate-x-1/2',
        top: 'top-4 inset-inline-4 mx-auto w-[calc(100%-2rem)]',
      },
    },
    defaultVariants: { maxWidth: 'lg', position: 'center' },
  }
);

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalContentProps
>(({ children, className, maxWidth = 'lg', position = 'center', accessibleTitle, onOpenAutoFocus, onCloseAutoFocus, ...props }, ref) => {
  const layer = useContext(ModalLayerContext);
  const title = getModalTitle(children, accessibleTitle);
  return (
    <DialogPrimitive.Content
      ref={ref}
      aria-describedby={props['aria-describedby'] ?? undefined}
      className={cn(modalContentVariants({ maxWidth, position }), className)}
      {...props}
      style={{ ...props.style, zIndex: layer.zIndex }}
      onOpenAutoFocus={event => {
        layer.captureReturnFocus();
        onOpenAutoFocus?.(event);
      }}
      onCloseAutoFocus={event => {
        onCloseAutoFocus?.(event);
        if (!event.defaultPrevented) layer.restoreFocus(event);
      }}
    >
      <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
      {children}
    </DialogPrimitive.Content>
  );
});
ModalContent.displayName = 'ModalContent';

export interface ModalHeaderProps {
  title: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

export const ModalHeader = ({ title, description, onClose, className }: ModalHeaderProps) => (
  <div className={cn('flex items-start justify-between border-b border-surface-200 p-5 dark:border-surface-800', className)}>
    <div className="flex-1">
      <h3 className="font-outfit text-lg font-bold text-surface-900 dark:text-white">
        {title}
      </h3>
      {description && (
        <DialogPrimitive.Description className="mt-1 font-outfit text-sm font-medium text-surface-500 dark:text-surface-400">
          {description}
        </DialogPrimitive.Description>
      )}
    </div>
    {onClose && (
      <DialogPrimitive.Close asChild>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
          aria-label="Close"
        >
          <X size={20} className="text-surface-500" />
        </button>
      </DialogPrimitive.Close>
    )}
  </div>
);

export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

export const ModalBody = ({ children, className, scrollable }: ModalBodyProps) => (
  <div className={cn('p-5', scrollable && 'max-h-[70vh] overflow-y-auto', className)}>{children}</div>
);

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export const ModalFooter = ({ children, className, align = 'end' }: ModalFooterProps) => (
  <div
    className={cn(
      'flex gap-3 border-t border-surface-200 p-5 dark:border-surface-800',
      align === 'start' && 'justify-start',
      align === 'center' && 'justify-center',
      align === 'end' && 'justify-end',
      className
    )}
  >
    {children}
  </div>
);
