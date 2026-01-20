'use client';

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface OnboardingStepProps {
  children: ReactNode;
  title: string;
  description?: string;
  isActive: boolean;
  className?: string;
}

export function OnboardingStep({
  children,
  title,
  description,
  isActive,
  className,
}: OnboardingStepProps) {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('w-full max-w-lg mx-auto', className)}
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">{title}</h2>
        {description && <p className="text-surface-500 dark:text-surface-400">{description}</p>}
      </div>
      <div className="bg-white dark:bg-surface-900/50 backdrop-blur-sm border border-surface-200 dark:border-surface-800 rounded-2xl p-6 md:p-8 shadow-xl shadow-blue-500/5">
        {children}
      </div>
    </motion.div>
  );
}
