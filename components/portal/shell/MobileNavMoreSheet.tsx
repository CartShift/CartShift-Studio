'use client';

import { createPortal } from 'react-dom';
import { useEffect } from 'react';
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

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const primarySet = new Set(primaryHrefs);
  const overflowItems = navGroups.flatMap(group =>
    group.items.filter(item => !primarySet.has(item.href))
  );

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-surface-950/50 md:hidden"
        aria-label={t('closeMenu')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('moreNavigation')}
        className={cn(
          'fixed inset-x-0 bottom-0 z-[61] md:hidden',
          'rounded-t-2xl border-t border-surface-200 dark:border-surface-800',
          'bg-white dark:bg-surface-950 pb-safe max-h-[70vh] overflow-y-auto'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-800">
          <h2 className="text-sm font-semibold text-surface-900 dark:text-white">
            {t('moreNavigation')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="portal-focus-ring p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
            aria-label={t('closeMenu')}
          >
            <X size={20} />
          </button>
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
      </div>
    </>,
    document.body
  );
}
