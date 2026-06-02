'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Button } from './Button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BarChart3, Zap, ArrowRight, X, CheckCircle } from 'lucide-react';
import {
  trackExitIntentShown,
  trackExitIntentClosed,
  trackAnalyzerStarted,
} from '@/lib/analytics';
import { getScheduleUrl } from '@/lib/schedule';
import { ModalBackdrop, ModalContent } from './ModalBackdrop';

interface ExitIntentModalProps {
  delay?: number;
  storageKey?: string;
}

export const ExitIntentModal: React.FC<ExitIntentModalProps> = ({
  delay = 5000,
  storageKey = 'exitIntentShown',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const wasShown = sessionStorage.getItem(storageKey);
    if (wasShown) {
      return;
    }

    let isTriggered = false;

    const handleExitIntent = (e: MouseEvent) => {
      if (isTriggered || e.clientY > 0 || e.relatedTarget !== null) return;

      isTriggered = true;
      setIsOpen(true);
      sessionStorage.setItem(storageKey, 'true');
      trackExitIntentShown();

      document.removeEventListener('mouseleave', handleExitIntent);
    };

    const timer = setTimeout(() => {
      document.documentElement.addEventListener('mouseleave', handleExitIntent);
    }, delay);

    return () => {
      clearTimeout(timer);
      document.documentElement.removeEventListener('mouseleave', handleExitIntent);
    };
  }, [delay, storageKey]);

  const handleClose = useCallback((action: 'cta_clicked' | 'dismissed' = 'dismissed') => {
    trackExitIntentClosed(action);
    setIsOpen(false);
  }, []);

  const handleAnalyzerClick = useCallback(() => {
    trackAnalyzerStarted('exit_intent');
    handleClose('cta_clicked');
  }, [handleClose]);

  const handleBackdropClick = useCallback(() => {
    handleClose('dismissed');
  }, [handleClose]);

  const handleCloseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleClose('dismissed');
    },
    [handleClose]
  );

  if (!mounted) return null;

  return (
    <ModalBackdrop
      isOpen={isOpen}
      onClick={handleBackdropClick}
      variant="default"
      blur="sm"
      zIndex="200"
    >
      <ModalContent maxWidth="lg" onClick={e => e.stopPropagation()}>
        <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden">
          <button
            onClick={handleCloseClick}
            className="absolute top-4 end-4 p-2 rounded-full hover:bg-surface-100 dark:hover:bg-white/10 transition-colors z-tooltip"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-surface-500" />
          </button>

          <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-8 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }}
              />
            </div>

            <div className="relative text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mb-6"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mx-auto mb-4 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-bold mb-3">{t('exitIntent.heading')}</h2>
                <p className="text-lg text-white/90 leading-relaxed">
                  {t('exitIntent.subheading')}
                </p>
              </motion.div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                  <BarChart3 className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
                  <div className="text-start">
                    <h3 className="font-semibold text-white mb-1">
                      {t('exitIntent.feature1Title')}
                    </h3>
                    <p className="text-sm text-white/80">{t('exitIntent.feature1Description')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                  <CheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <div className="text-start">
                    <h3 className="font-semibold text-white mb-1">
                      {t('exitIntent.feature2Title')}
                    </h3>
                    <p className="text-sm text-white/80">{t('exitIntent.feature2Description')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-surface-900">
            <div className="mb-6">
              <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed mb-4">
                {t('exitIntent.description')}
              </p>
              <Link
                href="/"
                className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline"
              >
                {t('exitIntent.learnMore')}
              </Link>
            </div>

            <Link href="/tools/store-analyzer" onClick={handleAnalyzerClick} className="block">
              <Button className="w-full group relative overflow-hidden font-outfit" size="lg">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {t('exitIntent.cta')}
                  <ArrowRight
                    size={18}
                    className="rtl:-scale-x-100 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform"
                  />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-700 to-accent-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>

            <a
              href={getScheduleUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClose('cta_clicked')}
              className="mt-4 block text-center text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400"
            >
              {t('exitIntent.secondaryCta')}
            </a>
          </div>
        </div>
      </ModalContent>
    </ModalBackdrop>
  );
};
