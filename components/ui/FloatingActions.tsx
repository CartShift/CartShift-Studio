'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Icon } from './Icon';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { trackBookCallClick, trackWhatsAppClick } from '@/lib/analytics';
import { getScheduleUrl } from '@/lib/schedule';
import { Calendar, X } from 'lucide-react';

interface FloatingActionsProps {
  showAfterPercent?: number;
  className?: string;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  showAfterPercent = 25,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations();

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '972503591552';
  const whatsappMessage = t('floatingActions.whatsappMessage');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  const scheduleUrl = getScheduleUrl();

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPercent =
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
          setIsVisible(scrollPercent > showAfterPercent);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterPercent]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.floating-actions-container')) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
    return undefined;
  }, [isExpanded]);

  const handleScheduleClick = () => {
    trackBookCallClick('floating_actions');
    setIsExpanded(false);
  };

  const handleWhatsAppClick = () => {
    trackWhatsAppClick();
    setIsExpanded(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Desktop Version */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'floating-actions-container fixed bottom-6 end-6 z-modal hidden md:flex flex-col items-end gap-2',
              className
            )}
          >
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-2 mb-2"
                >
                  {/* Schedule Button */}
                  <motion.a
                    href={scheduleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleScheduleClick}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15, delay: 0.05 }}
                    className="flex items-center gap-3 ps-4 pe-5 py-2.5 rounded-full bg-white dark:bg-surface-800 text-surface-800 dark:text-white font-medium shadow-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors font-outfit"
                  >
                    <Calendar className="w-4 h-4 text-surface-600 dark:text-surface-300" />
                    <span className="text-sm font-bold">{t('floatingActions.bookCall')}</span>
                  </motion.a>

                  {/* WhatsApp Button */}
                  <motion.a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleWhatsAppClick}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-3 ps-4 pe-5 py-2.5 rounded-full bg-white dark:bg-surface-800 text-surface-800 dark:text-white font-medium shadow-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors font-outfit"
                  >
                    <Icon name="whatsapp" size={16} className="text-[#25D366]" />
                    <span className="text-sm font-bold">{t('floatingActions.whatsapp')}</span>
                  </motion.a>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Toggle Button */}
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center shadow-lg border',
                'bg-white dark:bg-surface-800',
                'text-surface-800 dark:text-white',
                'border-surface-200 dark:border-surface-700',
                'hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors'
              )}
              aria-label={t('floatingActions.openContact')}
              aria-expanded={isExpanded}
            >
              <motion.div animate={{ rotate: isExpanded ? 45 : 0 }} transition={{ duration: 0.2 }}>
                {isExpanded ? (
                  <X className="w-5 h-5" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                )}
              </motion.div>
            </motion.button>
          </motion.div>

          {/* Mobile Version */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 inset-x-0 z-modal md:hidden safe-bottom"
          >
            <div className="bg-white/98 dark:bg-surface-900/98 backdrop-blur-lg border-t border-surface-200 dark:border-surface-800 px-4 py-3 shadow-2xl">
              <div className="flex gap-2">
                {/* Schedule Button */}
                <a
                  href={scheduleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleScheduleClick}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl fashion-gradient text-white font-bold shadow-lg hover:shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all font-outfit"
                >
                  <Calendar className="w-5 h-5" />
                  <span>{t('floatingActions.bookCall')}</span>
                </a>

                {/* WhatsApp Button */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsAppClick}
                  className="flex items-center justify-center w-14 rounded-xl bg-surface-100 dark:bg-surface-800 text-[#25D366] dark:text-[#25D366] shadow-sm hover:bg-surface-200 dark:hover:bg-surface-700 active:scale-[0.98] transition-all border border-surface-200 dark:border-surface-700"
                  aria-label={t('floatingActions.whatsapp')}
                >
                  <Icon name="whatsapp" size={24} />
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
