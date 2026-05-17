'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from './Button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const COOKIE_CONSENT_KEY = 'cookie_consent';

interface CookieConsentProps {
  variant?: 'default' | 'compact';
  className?: string;
  delayMs?: number;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({
  variant = 'default',
  className,
  delayMs = 1500,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), delayMs);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [delayMs]);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setIsVisible(false);
  };

  const content = {
    message: t('privacy.sections.cookies.consent.message'),
    accept: t('privacy.sections.cookies.consent.accept'),
    decline: t('privacy.sections.cookies.consent.decline'),
    learnMore: t('privacy.sections.cookies.consent.learnMore'),
  };

  const isCompact = variant === 'compact';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'fixed inset-x-0 z-[150] p-3 print:hidden',
            isCompact ? 'bottom-3 sm:bottom-4' : 'bottom-0 md:p-6',
            className
          )}
          data-cookie-consent-variant={variant}
        >
          <div
            className={cn(
              'mx-auto border shadow-2xl',
              isCompact
                ? 'max-w-xl rounded-xl border-white/10 bg-slate-950/92 p-3 text-white backdrop-blur-xl shadow-slate-950/30'
                : 'max-w-4xl rounded-2xl border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800 md:p-6'
            )}
          >
            <div
              className={cn(
                'flex gap-3',
                isCompact ? 'items-center' : 'flex-col md:flex-row md:items-center md:gap-4'
              )}
            >
              <div className="flex-1">
                <p
                  className={cn(
                    'leading-relaxed',
                    isCompact
                      ? 'text-xs text-white/78'
                      : 'text-sm text-surface-600 dark:text-surface-400 md:text-base'
                  )}
                >
                  {content.message}{' '}
                  <Link
                    href="/privacy"
                    className={cn(
                      'font-semibold hover:underline',
                      isCompact ? 'text-primary-300' : 'text-accent-600 dark:text-accent-400'
                    )}
                    aria-label={content.learnMore}
                  >
                    {content.learnMore}
                  </Link>
                </p>
              </div>
              <div className={cn('flex items-center', isCompact ? 'shrink-0 gap-2' : 'gap-3')}>
                <button
                  onClick={handleDecline}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isCompact
                      ? 'text-white/60 hover:text-white'
                      : 'text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white'
                  )}
                >
                  {content.decline}
                </button>
                <Button size={isCompact ? 'sm' : 'sm'} onClick={handleAccept}>
                  {content.accept}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
