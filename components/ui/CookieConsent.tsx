'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from './Button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const COOKIE_CONSENT_KEY = 'cookie_consent';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 inset-x-0 z-[150] p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="text-surface-600 dark:text-surface-400 text-sm md:text-base">
                  {content.message}{' '}
                  <Link
                    href="/privacy"
                    className="text-accent-600 dark:text-accent-400 hover:underline"
                    aria-label={`${content.learnMore} - Privacy Policy`}
                  >
                    {content.learnMore} about our Privacy Policy
                  </Link>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDecline}
                  className="px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"
                >
                  {content.decline}
                </button>
                <Button size="sm" onClick={handleAccept}>
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
