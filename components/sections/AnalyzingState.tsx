'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { Loader2, Sparkles } from 'lucide-react';
import type { AnalyzerProgressPhase } from '@/lib/hooks/use-analyzer-progress';

interface AnalyzingStateProps {
  progress: number;
  currentStep: string;
  elapsedMs: number;
  phase: AnalyzerProgressPhase;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
}

export const AnalyzingState: React.FC<AnalyzingStateProps> = ({
  progress,
  currentStep,
  elapsedMs,
  phase,
}) => {
  const t = useTranslations('analyzer.analyzing');

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md bg-white dark:bg-white/5 border border-surface-200 dark:border-white/10 backdrop-blur-xl shadow-premium rounded-2xl p-10 text-center">
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

        <h3 className="text-2xl font-bold mb-2 text-surface-900 dark:text-white">
          {t('title')}
        </h3>

        <p className="text-sm text-surface-500 dark:text-white/50 mb-6">{t('durationHint')}</p>

        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 h-6 text-surface-700 dark:text-white/80 font-medium"
        >
          {currentStep}
        </motion.p>

        <p className="text-xs text-surface-500 dark:text-white/40 mb-8">
          {t('phaseLabel', { phase: t(`phases.${phase}`) })} · {formatElapsed(elapsedMs)}
        </p>

        <div className="relative">
          <div className="h-3 rounded-full overflow-hidden bg-surface-200 dark:bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-2 flex justify-between text-sm text-surface-500 dark:text-white/50">
            <span>{progress < 100 ? t('inProgress') : t('finishing')}</span>
            <span>{progress}%</span>
          </div>
        </div>

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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 p-4 rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-600 dark:text-primary-400" />
            <p className="text-sm text-start text-primary-700 dark:text-primary-300">{t('tip')}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
