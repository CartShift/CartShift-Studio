'use client';

import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { isRTLLocale } from '@/lib/locale-config';
import { PortalSidebarProps } from './types';

export function PortalSidebar({
  isExpanded,
  isMobileMenuOpen,
  onTouchStart,
  onTouchEnd,
  children,
  viewTransitionName,
}: PortalSidebarProps) {
  const locale = useLocale();

  return (
    <aside
      {...(viewTransitionName && { 'view-transition-name': viewTransitionName })}
      className={cn(
        'portal-sidebar fixed top-0 bottom-0 z-[70] flex flex-col transition-transform duration-300',
        'bg-white dark:bg-surface-950/80 backdrop-blur-xl',
        'border-e border-surface-200/50 dark:border-surface-800/30 shadow-2xl shadow-surface-950/20',
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
      aria-label="Navigation"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </aside>
  );
}
