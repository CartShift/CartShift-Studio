'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/Toast';

export function MarketingStatusToast() {
  const searchParams = useSearchParams();
  const status = searchParams.get('unsubscribe');
  const shownStatus = useRef<string | null>(null);
  const t = useTranslations('marketing.unsubscribe');
  const toast = useToast();

  useEffect(() => {
    if (!status || shownStatus.current === status) return;
    shownStatus.current = status;

    if (status === 'success') {
      toast.success(t('successTitle'), t('successMessage'));
    } else if (status === 'failed') {
      toast.error(t('errorTitle'), t('errorMessage'));
    } else if (status === 'invalid') {
      toast.warning(t('invalidTitle'), t('invalidMessage'));
    }

    const url = new URL(window.location.href);
    url.searchParams.delete('unsubscribe');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [status, t, toast]);

  return null;
}
