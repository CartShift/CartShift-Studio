'use client';

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface EmptyStateIllustrationProps {
  variant?: 'activity' | 'requests' | 'files';
  className?: string;
}

export function EmptyStateIllustration({
  variant = 'activity',
  className,
}: EmptyStateIllustrationProps) {
  const illustrations = {
    activity: <ActivityIllustration />,
    requests: <RequestsIllustration />,
    files: <FilesIllustration />,
  };

  return <div className={cn('w-48 h-48', className)}>{illustrations[variant]}</div>;
}

function ActivityIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <motion.circle
        cx="100"
        cy="100"
        r="80"
        className="fill-surface-100 dark:fill-surface-800/50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* Timeline line */}
      <motion.line
        x1="70"
        y1="50"
        x2="70"
        y2="150"
        className="stroke-surface-200 dark:stroke-surface-700"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />

      {/* Timeline dots */}
      {[60, 90, 120].map((y, i) => (
        <motion.g key={y}>
          <motion.circle
            cx="70"
            cy={y}
            r="6"
            className="fill-blue-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.15 }}
          />
          {/* Content card placeholder */}
          <motion.rect
            x="85"
            y={y - 10}
            width="55"
            height="20"
            rx="4"
            className="fill-white dark:fill-surface-800"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + i * 0.15 }}
          />
          <motion.rect
            x="90"
            y={y - 5}
            width="40"
            height="3"
            rx="1.5"
            className="fill-surface-200 dark:fill-surface-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.7 + i * 0.15 }}
          />
          <motion.rect
            x="90"
            y={y + 2}
            width="25"
            height="2"
            rx="1"
            className="fill-surface-100 dark:fill-surface-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.75 + i * 0.15 }}
          />
        </motion.g>
      ))}

      {/* Floating sparkle */}
      <motion.path
        d="M150 60 L152 66 L158 68 L152 70 L150 76 L148 70 L142 68 L148 66 Z"
        className="fill-amber-400"
        initial={{ opacity: 0, scale: 0, rotate: -30 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      />
    </svg>
  );
}

function RequestsIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.circle
        cx="100"
        cy="100"
        r="80"
        className="fill-surface-100 dark:fill-surface-800/50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* Empty clipboard */}
      <motion.rect
        x="60"
        y="45"
        width="80"
        height="110"
        rx="8"
        className="fill-white dark:fill-surface-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />

      {/* Clipboard clip */}
      <motion.rect
        x="80"
        y="40"
        width="40"
        height="12"
        rx="4"
        className="fill-blue-500"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      />

      {/* Lines on clipboard */}
      {[70, 90, 110].map((y, i) => (
        <motion.rect
          key={y}
          x="75"
          y={y}
          width={60 - i * 10}
          height="4"
          rx="2"
          className="fill-surface-100 dark:fill-surface-700"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
        />
      ))}

      {/* Plus icon hint */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.9 }}
      >
        <circle cx="155" cy="135" r="18" className="fill-emerald-500" />
        <rect x="152" y="127" width="6" height="16" rx="2" className="fill-white" />
        <rect x="147" y="132" width="16" height="6" rx="2" className="fill-white" />
      </motion.g>
    </svg>
  );
}

function FilesIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.circle
        cx="100"
        cy="100"
        r="80"
        className="fill-surface-100 dark:fill-surface-800/50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* Folder back */}
      <motion.path
        d="M50 70 L50 140 Q50 150 60 150 L140 150 Q150 150 150 140 L150 80 Q150 70 140 70 L100 70 L90 55 L60 55 Q50 55 50 65 Z"
        className="fill-amber-400"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />

      {/* Folder front */}
      <motion.path
        d="M45 85 L45 145 Q45 155 55 155 L145 155 Q155 155 155 145 L155 95 Q155 85 145 85 Z"
        className="fill-amber-300"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      />

      {/* Upload arrow */}
      <motion.g
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <path
          d="M100 100 L100 130"
          className="stroke-amber-600"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M90 110 L100 100 L110 110"
          className="stroke-amber-600"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.g>
    </svg>
  );
}
