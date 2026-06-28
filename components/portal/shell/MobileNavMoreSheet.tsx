'use client';

import { Dialog } from 'radix-ui';
import { Link } from '@/i18n/navigation';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { isPortalNavActive } from '@/lib/utils/portal-nav';
import { usePathname } from '@/i18n/navigation';
import type { NavGroup } from './types';

interface MobileNavMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  navGroups: NavGroup[];
  primaryHrefs: string[];
}

export function MobileNavMoreSheet({
  isOpen,
  onClose,
  navGroups,
  primaryHrefs,
}: MobileNavMoreSheetProps) {
  const t = useTranslations('portal.accessibility');
  const pathname = usePathname();

  const primarySet = new Set(primaryHrefs);
  const overflowItems = navGroups.flatMap(group =>
    group.items.filter(item => !primarySet.has(item.href))
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-surface-950/50 md:hidden data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
        <Dialog.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-[61] md:hidden',
          'rounded-t-2xl border-t border-surface-200 dark:border-surface-800',
          'bg-white dark:bg-surface-950 pb-safe max-h-[70vh] overflow-y-auto outline-none',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full motion-reduce:animate-none'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-800">
          <Dialog.Title className="text-sm font-semibold text-surface-900 dark:text-white">
            {t('moreNavigation')}
          </Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              className="portal-focus-ring p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
              aria-label={t('closeMenu')}
            >
              <X size={20} />
            </button>
          </Dialog.Close>
        </div>
        <nav className="p-2 space-y-0.5" aria-label={t('moreNavigation')}>
          {overflowItems.map(item => {
            const isActive = isPortalNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'portal-focus-ring flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800/60'
                )}
              >
                <Icon size={18} aria-hidden className="shrink-0 opacity-80" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
