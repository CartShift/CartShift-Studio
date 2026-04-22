'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeroProps {
  title: string;
  subtitle: string;
  description: string;
  badge?: string;
  highlightLastWord?: boolean;
  seoH1?: string;
  compact?: boolean;
}

const HeroBlob = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.1, 0.15, 0.1],
      rotate: [0, 45, 0],
    }}
    transition={{
      duration: 15,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
    className={cn(
      'absolute rounded-full blur-[100px] pointer-events-none opacity-40 dark:opacity-20',
      className
    )}
  />
);

export const PageHero: React.FC<PageHeroProps> = ({
  title,
  subtitle,
  description,
  badge,
  highlightLastWord = true,
  seoH1,
  compact = false,
}) => {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center pt-32 sm:pt-40 pb-16 md:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-background dark:bg-black transition-colors duration-500">
      {/* Immersive Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-surface-50 to-surface-100 dark:from-black dark:via-black dark:to-surface-950 transition-colors duration-500" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04] dark:opacity-[0.07] transition-opacity duration-500" />

      <HeroBlob className="top-[-10%] -start-20 w-[600px] h-[600px] bg-primary-500/20 dark:bg-primary-500/10" />
      <HeroBlob
        className="bottom-[-10%] -end-20 w-[500px] h-[500px] bg-accent-500/20 dark:bg-accent-600/10"
        delay={2}
      />

      <div className="max-w-7xl mx-auto relative z-10 w-full group">
        <div className="max-w-4xl mx-auto text-center">
          {badge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/80 dark:bg-white/5 border border-surface-200/60 dark:border-white/10 backdrop-blur-xl mb-10 shadow-premium transition-transform duration-300"
            >
              <Sparkles className="w-4 h-4 text-accent-500" />
              <span className="text-surface-700 dark:text-surface-200 text-sm font-bold tracking-tight uppercase">
                {badge}
              </span>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'font-display font-bold leading-[1.1] tracking-tight mb-8 text-surface-900 dark:text-white transition-colors duration-500',
              compact ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-5xl md:text-7xl lg:text-8xl'
            )}
          >
            {seoH1 && <span className="sr-only">{seoH1}</span>}
            <span aria-hidden={!!seoH1}>
              {highlightLastWord
                ? (() => {
                    const words = title.split(' ');
                    const last = words.pop();
                    return (
                      <>
                        {words.join(' ')} <span className="gradient-text">{last}</span>
                      </>
                    );
                  })()
                : title}
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <p className="text-2xl md:text-3xl text-surface-600 dark:text-surface-300 font-display leading-tight font-medium transition-colors">
              {subtitle}
            </p>
            <p className="text-lg md:text-xl text-surface-500 dark:text-surface-400 max-w-2xl mx-auto leading-relaxed font-light transition-colors">
              {description}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Hero Bottom Mask */}
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-background dark:from-black via-background/60 dark:via-black/60 to-transparent z-sticky" />
    </section>
  );
};
