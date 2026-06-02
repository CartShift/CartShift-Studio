'use client';

import { useLocale } from 'next-intl';
import { useEffect, useLayoutEffect } from 'react';
import { getLocaleDirection, isRTLLocale } from '@/lib/locale-config';

// Use useLayoutEffect on client to prevent flicker, but fall back to useEffect during SSR
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function LocaleAttributes() {
  const locale = useLocale();
  const direction = getLocaleDirection(locale);
  const isRTL = isRTLLocale(locale);

  // Use layoutEffect to set critical layout attributes BEFORE paint
  // This prevents the RTL flicker where content renders LTR first
  useIsomorphicLayoutEffect(() => {
    // Set direction and lang immediately before browser paint
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;

    // Add/remove RTL-specific class
    if (isRTL) {
      document.body.classList.add('lang-he');
      document.documentElement.classList.add('rtl-ready');
    } else {
      document.body.classList.remove('lang-he');
      document.documentElement.classList.remove('rtl-ready');
    }
  }, [locale, direction, isRTL]);

  return null;
}
