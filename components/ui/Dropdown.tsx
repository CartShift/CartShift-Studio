'use client';

import React, { useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Dialog, DropdownMenu } from 'radix-ui';
import { cn } from '@/lib/utils';

const dropdownMenuVariants = cva(
  'z-dropdown min-w-[200px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 motion-reduce:animate-none',
  {
    variants: {
      align: {
        start: '',
        center: '',
        end: '',
        left: '',
        right: '',
      },
    },
    defaultVariants: { align: 'end' },
  }
);

const dropdownItemVariants = cva(
  'relative flex min-h-[44px] w-full cursor-default select-none items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-medium outline-none transition-colors duration-150 touch-manipulation data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  {
    variants: {
      variant: {
        default: 'text-slate-700 data-[highlighted]:bg-slate-100 dark:text-slate-200 dark:data-[highlighted]:bg-slate-800',
        danger: 'text-red-600 data-[highlighted]:bg-red-50 dark:text-red-400 dark:data-[highlighted]:bg-red-900/20',
      },
      isDisabled: { true: 'cursor-not-allowed opacity-50', false: '' },
      active: {
        true: 'bg-slate-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400',
        false: '',
      },
    },
    defaultVariants: { variant: 'default', isDisabled: false, active: false },
  }
);

export interface DropdownItem extends VariantProps<typeof dropdownItemVariants> {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
}

interface DropdownProps extends VariantProps<typeof dropdownMenuVariants> {
  trigger: React.ReactNode;
  items: DropdownItem[];
  className?: string;
}

function useMobileMenu() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isMobile;
}

export function Dropdown({ trigger, items, align = 'end', className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useMobileMenu();
  const logicalAlign = align === 'left' ? 'start' : align === 'right' ? 'end' : align || 'end';
  const triggerElement = React.isValidElement(trigger) ? (
    trigger
  ) : (
    <button type="button" className="inline-flex items-center justify-center">
      {trigger}
    </button>
  );

  if (isMobile) {
    return (
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          {triggerElement}
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-modal bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-tooltip flex max-h-[85vh] flex-col overflow-hidden rounded-t-3xl border-t border-surface-200 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] outline-none dark:border-surface-800 dark:bg-surface-900 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full motion-reduce:animate-none">
            <Dialog.Title className="sr-only">Actions</Dialog.Title>
            <Dialog.Description className="sr-only">Choose an action</Dialog.Description>
            <div className="mx-auto my-3 h-1.5 w-12 shrink-0 rounded-full bg-surface-200 dark:bg-surface-800" />
            <div className={cn('overflow-y-auto px-4 pb-8 pt-2', className)}>
              {items.map((item, index) => (
                <Dialog.Close asChild key={`${item.label}-${index}`}>
                  <button
                    type="button"
                    disabled={item.disabled}
                    onClick={item.onClick}
                    className={cn(
                      dropdownItemVariants({
                        variant: item.variant,
                        isDisabled: item.disabled,
                        active: item.active,
                      }),
                      'py-4 text-base'
                    )}
                  >
                    {item.icon && <span className="shrink-0" aria-hidden="true">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                </Dialog.Close>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        {triggerElement}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={logicalAlign}
          sideOffset={6}
          collisionPadding={12}
          className={cn(dropdownMenuVariants({ align }), className)}
        >
          {items.map((item, index) => (
            <DropdownMenu.Item
              key={`${item.label}-${index}`}
              disabled={item.disabled}
              onSelect={item.onClick}
              className={dropdownItemVariants({
                variant: item.variant,
                isDisabled: item.disabled,
                active: item.active,
              })}
            >
              {item.icon && <span className="shrink-0" aria-hidden="true">{item.icon}</span>}
              <span>{item.label}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export { dropdownItemVariants, dropdownMenuVariants };
