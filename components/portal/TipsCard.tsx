'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Lightbulb, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDirection } from '@/lib/i18n-utils';
import { Card } from '@/components/ui/Card';

export function TipsCard() {
  const t = useTranslations('portal.dashboard.tips');
  const direction = useDirection();
  const isRtl = direction === 'rtl';

  // Get tips from translations
  const tips = t.raw('items') as string[];
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Auto-rotate tips every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % tips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [tips.length]);

  const goToNextTip = () => {
    setCurrentTipIndex(prev => (prev + 1) % tips.length);
  };

  const goToPrevTip = () => {
    setCurrentTipIndex(prev => (prev - 1 + tips.length) % tips.length);
  };

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <Card className="border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 shadow-sm overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
          <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[10px] font-black text-blue-600/70 dark:text-blue-400/70 uppercase tracking-widest mb-2">
            {t('title')}
          </h4>
          <div className="relative h-12 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTipIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-surface-700 dark:text-surface-300 font-medium leading-relaxed"
              >
                {tips[currentTipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Navigation dots and arrows */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-1.5">
              {tips.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTipIndex(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === currentTipIndex
                      ? 'bg-blue-600 dark:bg-blue-400 w-4'
                      : 'bg-surface-300 dark:bg-surface-600 hover:bg-blue-400 dark:hover:bg-blue-500'
                  }`}
                  aria-label={`Tip ${index + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <button
                onClick={goToPrevTip}
                className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                aria-label="Previous tip"
              >
                <PrevIcon className="w-4 h-4 text-surface-400" />
              </button>
              <button
                onClick={goToNextTip}
                className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                aria-label="Next tip"
              >
                <NextIcon className="w-4 h-4 text-surface-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
