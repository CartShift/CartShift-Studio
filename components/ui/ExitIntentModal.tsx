'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from './Button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { trackExitIntentShown, trackExitIntentClosed, trackBookCallClick } from '@/lib/analytics';
import { BarChart3, Zap, ArrowRight, X, CheckCircle } from 'lucide-react';

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
      // Only trigger when mouse leaves viewport from the top
      if (isTriggered || e.clientY > 0 || e.relatedTarget !== null) return;

      isTriggered = true;
      setIsOpen(true);
      sessionStorage.setItem(storageKey, 'true');
      trackExitIntentShown();

      // Remove listener immediately after triggering
      document.removeEventListener('mouseleave', handleExitIntent);
    };

    const timer = setTimeout(() => {
      // Use mouseleave on document instead of mouseout for better performance
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

  const handleCTAClick = useCallback(() => {
    trackBookCallClick('exit_intent_store_analyzer');
    handleClose('cta_clicked');
  }, [handleClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleClose('dismissed');
    },
    [handleClose]
  );

  const handleCloseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleClose('dismissed');
    },
    [handleClose]
  );

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={handleBackdropClick}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, y: 20, x: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 z-[201] w-full max-w-lg mx-4"
            style={{ x: '-50%', y: '-50%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleCloseClick}
                className="absolute top-4 end-4 p-2 rounded-full hover:bg-surface-100 dark:hover:bg-white/10 transition-colors z-20"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-surface-500" />
              </button>

              {/* Header with gradient */}
              <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-8 text-white overflow-hidden">
                {/* Background pattern */}
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
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4"
                  >
                    <BarChart3 className="w-8 h-8" />
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    {t('common.exitIntent.title')}
                  </h2>
                  <p className="text-white/90 text-lg">Get a free store audit before you go</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8">
                {/* Value props */}
                <div className="space-y-3 mb-6">
                  {[
                    { icon: Zap, text: 'Performance & speed analysis' },
                    { icon: BarChart3, text: 'SEO & conversion insights' },
                    { icon: CheckCircle, text: 'Actionable recommendations' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-surface-700 dark:text-surface-300">{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-6 py-4 mb-6 border-y border-surface-200 dark:border-surface-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-surface-900 dark:text-white">
                      2,500+
                    </div>
                    <div className="text-xs text-surface-500">Stores Analyzed</div>
                  </div>
                  <div className="w-px h-10 bg-surface-200 dark:bg-surface-700" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-surface-900 dark:text-white">
                      &lt;60s
                    </div>
                    <div className="text-xs text-surface-500">Instant Results</div>
                  </div>
                  <div className="w-px h-10 bg-surface-200 dark:bg-surface-700" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      FREE
                    </div>
                    <div className="text-xs text-surface-500">No Credit Card</div>
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-3">
                  <Link href="/tools/store-analyzer" className="block" onClick={handleCTAClick}>
                    <Button
                      className="w-full group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-none shadow-lg shadow-indigo-500/25"
                      size="lg"
                    >
                      <span className="flex items-center gap-2 justify-center">
                        <BarChart3 className="w-5 h-5" />
                        Analyze My Store Free
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                  <button
                    onClick={handleCloseClick}
                    className="w-full py-2 text-sm text-surface-500 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
                  >
                    {t('common.exitIntent.dismiss')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
};
