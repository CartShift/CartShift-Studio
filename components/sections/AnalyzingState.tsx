'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { Loader2, Sparkles } from 'lucide-react';

interface AnalyzingStateProps {
  progress: number;
  currentStep: string;
  variant?: 'default' | 'dark';
}

export const AnalyzingState: React.FC<AnalyzingStateProps> = ({ progress, currentStep }) => {
  const t = useTranslations();

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md bg-white dark:bg-white/5 border border-surface-200 dark:border-white/10 backdrop-blur-xl shadow-premium rounded-2xl p-10 text-center">
        {/* Animated Logo/Icon */}
        <motion.div
          className="w-24 h-24 mx-auto mb-8 relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 opacity-20 blur-lg" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Loader2 className="w-10 h-10 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <h3 className="text-2xl font-bold mb-3 text-surface-900 dark:text-white">
          {t('analyzer.analyzing.title') || 'Analyzing Your Store'}
        </h3>

        {/* Current Step */}
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 h-6 text-surface-600 dark:text-white/60"
        >
          {currentStep}
        </motion.p>

        {/* Progress Bar */}
        <div className="relative">
          <div className="h-3 rounded-full overflow-hidden bg-surface-200 dark:bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-2 flex justify-between text-sm text-surface-500 dark:text-white/50">
            <span>{progress}%</span>
            <span>{t('analyzer.analyzing.pleaseWait') || 'Please wait...'}</span>
          </div>
        </div>

        {/* Scanning Animation */}
        <motion.div
          className="mt-8 flex justify-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div
              key={i}
              className="w-2 h-8 bg-gradient-to-t from-primary-500 to-accent-500 rounded-full"
              animate={{
                scaleY: [0.5, 1, 0.5],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </motion.div>

        {/* Tips while waiting */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 p-4 rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-600 dark:text-primary-400" />
            <p className="text-sm text-start text-primary-700 dark:text-primary-300">
              {t('analyzer.analyzing.tip') ||
                'Did you know? Stores that optimize based on audit reports see an average 35% improvement in conversions.'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
