'use client';

import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { GlobalSearch } from './GlobalSearch';
import { getPortalPath } from '@/lib/utils/portal-paths';

export interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

/** Mobile and desktop share the same indexed entities and search semantics. */
export function MobileSearch({ isOpen, onClose, className }: MobileSearchProps) {
  const t = useTranslations('portal');
  const { isAgency } = usePortalAuth();
  return (
    <Dialog.Root open={isOpen} onOpenChange={value => !value && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-always-on-top bg-surface-950/65 backdrop-blur-sm" />
        <Dialog.Content className={'fixed inset-x-3 top-[min(10vh,64px)] z-always-on-top mx-auto max-w-xl rounded-2xl border border-surface-200 bg-white p-4 shadow-2xl outline-none dark:border-surface-700 dark:bg-surface-900 ' + (className || '')}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <Dialog.Title className="text-base font-semibold">{t('header.search')}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="portal-focus-ring flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800" aria-label={t('common.close')}>
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          <GlobalSearch isAgency={isAgency} onSelect={onClose} />
          <div className="mt-5 flex flex-wrap gap-2 border-t border-surface-100 pt-4 text-sm dark:border-surface-800">
            <Link href={getPortalPath(isAgency ? '/agency/dashboard/' : '/dashboard/')} onClick={onClose} className="portal-focus-ring flex min-h-10 items-center rounded-xl bg-surface-100 px-3 font-semibold dark:bg-surface-800">{t('sidebar.nav.dashboard')}</Link>
            <Link href={getPortalPath('/requests/')} onClick={onClose} className="portal-focus-ring flex min-h-10 items-center rounded-xl bg-surface-100 px-3 font-semibold dark:bg-surface-800">{t('sidebar.nav.requests')}</Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
