'use client';

import React, { useEffect, useState } from 'react';
import { motion } from '@/lib/motion';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 'md', showLabel = true }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  const sizes = {
    sm: { width: 100, stroke: 8, fontSize: 'text-2xl' },
    md: { width: 140, stroke: 10, fontSize: 'text-3xl' },
    lg: { width: 180, stroke: 12, fontSize: 'text-4xl' },
  };

  const { width, stroke, fontSize } = sizes[size];
  const radius = (width - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Animate score counting up
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80)
      return { stroke: 'rgb(var(--color-success))', bg: 'text-emerald-500', label: 'Excellent' };
    if (s >= 60)
      return { stroke: 'rgb(var(--color-success))', bg: 'text-green-500', label: 'Good' };
    if (s >= 40)
      return { stroke: 'rgb(var(--color-warning))', bg: 'text-amber-500', label: 'Needs Work' };
    return { stroke: 'rgb(var(--color-error))', bg: 'text-red-500', label: 'Critical' };
  };

  const colorInfo = getScoreColor(score);

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={width} height={width} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-surface-200 dark:text-surface-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke={colorInfo.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="drop-shadow-md"
        />
        {/* Glow effect */}
        <motion.circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke={colorInfo.stroke}
          strokeWidth={stroke + 4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="opacity-20 blur-sm"
        />
      </svg>

      {/* Score number */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`${fontSize} font-bold text-surface-900 dark:text-white`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          {animatedScore}
        </motion.span>
        <span className="text-xs text-surface-500 dark:text-surface-400 mt-1">/ 100</span>
      </div>

      {/* Label */}
      {showLabel && (
        <motion.span
          className={`mt-4 text-sm font-medium ${colorInfo.bg}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          {colorInfo.label}
        </motion.span>
      )}
    </div>
  );
};
