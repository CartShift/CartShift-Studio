'use client';

import { useLocale } from 'next-intl';
import { Dialog } from 'radix-ui';
import { cn } from '@/lib/utils';
import { isRTLLocale } from '@/lib/locale-config';
import { PortalSidebarProps } from './types';

export function PortalSidebar({
  isExpanded,
  isMobileMenuOpen,
  onMobileMenuOpenChange,
  onTouchStart,
  onTouchEnd,
  children,
  viewTransitionName,
  sidebarRef,
  mobileMenuLabel,
}: PortalSidebarProps) {
  const locale = useLocale();

  const sidebar = (
    <aside
      ref={sidebarRef}
      {...(viewTransitionName && { 'view-transition-name': viewTransitionName })}
      className={cn(
        'portal-sidebar fixed top-0 bottom-0 z-[70] flex flex-col transition-transform duration-300',
        'text-surface-100',
        'w-[85vw] max-w-[320px] min-h-screen-mobile overflow-hidden',
        'pb-safe',
        'start-0',
        isMobileMenuOpen
          ? 'translate-x-0'
          : isRTLLocale(locale)
            ? 'translate-x-full'
            : '-translate-x-full',
        'md:translate-x-0',
        isExpanded
          ? 'md:w-[var(--sidebar-width-expanded)]'
          : 'md:w-[var(--sidebar-width-collapsed)]'
      )}
      aria-label={mobileMenuLabel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {isMobileMenuOpen && (
        <Dialog.Title className="sr-only">{mobileMenuLabel}</Dialog.Title>
      )}
      {children}
    </aside>
  );

  if (!isMobileMenuOpen) return sidebar;

  return (
    <Dialog.Root open onOpenChange={onMobileMenuOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[65] bg-surface-950/40 backdrop-blur-md md:hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
        <Dialog.Content asChild aria-describedby={undefined}>
          {sidebar}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
