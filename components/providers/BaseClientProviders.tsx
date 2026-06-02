'use client';

import type { ComponentProps, ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { BrandingProvider } from '@/components/providers/BrandingProvider';
import { LocaleAttributes } from '@/components/providers/LocaleAttributes';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { MotionConfig, MotionProvider } from '@/lib/motion';

type Messages = NonNullable<ComponentProps<typeof NextIntlClientProvider>['messages']>;

interface BaseClientProvidersProps {
  children: ReactNode;
  locale: 'en' | 'he';
  messages: Messages;
}

export function BaseClientProviders({
  children,
  locale,
  messages,
}: BaseClientProvidersProps) {
  const isRtl = locale === 'he';

  return (
    <ThemeProvider>
      <BrandingProvider>
        <MotionProvider>
          <MotionConfig
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
          >
            <NextIntlClientProvider messages={messages} locale={locale} timeZone="UTC">
              <QueryProvider>
                <ToastProvider position={isRtl ? 'bottom-left' : 'bottom-right'} maxToasts={5}>
                  <LocaleAttributes />
                  {children}
                </ToastProvider>
              </QueryProvider>
            </NextIntlClientProvider>
          </MotionConfig>
        </MotionProvider>
      </BrandingProvider>
    </ThemeProvider>
  );
}
