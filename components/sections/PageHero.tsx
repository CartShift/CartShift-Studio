'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { ParallaxLayer } from '@/components/ui/Parallax';
import { Sparkles } from 'lucide-react';

interface PageHeroProps {
  title: string;
  subtitle: string;
  description: string;
  badge?: string;
  highlightLastWord?: boolean;
  seoH1?: string;
  compact?: boolean;
}

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
    <section className="relative min-h-[50vh] flex items-center justify-center pt-24 sm:pt-28 md:pt-32 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-surface-100 dark:bg-surface-950">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-100 via-surface-100 to-surface-200 dark:from-surface-950 dark:to-surface-900 dark:opacity-40"></div>
      <div className="absolute top-0 start-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.06] dark:opacity-10"></div>

      <ParallaxLayer depth={0.6} baseSpeed={0.25}>
        <div className="absolute top-[-10%] start-[-10%] w-[30rem] h-[30rem] bg-primary-500/15 dark:bg-primary-600/15 rounded-full blur-[80px] animate-slow-spin"></div>
      </ParallaxLayer>
      <ParallaxLayer depth={0.8} baseSpeed={0.2}>
        <div
          className="absolute bottom-[-10%] end-[-10%] w-[30rem] h-[30rem] bg-accent-500/10 dark:bg-accent-600/10 rounded-full blur-[80px] animate-slow-spin"
          style={{ animationDirection: 'reverse' }}
        ></div>
      </ParallaxLayer>

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <div className="max-w-4xl mx-auto text-center">
          {badge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-white/5 border border-surface-300/50 dark:border-white/10 backdrop-blur-xl mb-8 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-accent-500" />
              <span className="text-surface-700 dark:text-surface-200 text-sm font-medium">
                {badge}
              </span>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={
              compact
                ? 'text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight tracking-tight mb-6 text-surface-900 dark:text-white'
                : 'text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight tracking-tight mb-6 text-surface-900 dark:text-white'
            }
          >
            {seoH1 ? (
              <>
                <span className="sr-only">{seoH1}</span>
                <span aria-hidden="true">
                  {highlightLastWord
                    ? (() => {
                        const titleWords = title.split(' ');
                        const lastWord = titleWords.pop();
                        return (
                          <>
                            {titleWords.join(' ')}{' '}
                            {lastWord && (
                              <span className="gradient-text text-glow-subtle">{lastWord}</span>
                            )}
                          </>
                        );
                      })()
                    : title}
                </span>
              </>
            ) : highlightLastWord ? (
              (() => {
                const titleWords = title.split(' ');
                const lastWord = titleWords.pop();
                return (
                  <>
                    {titleWords.join(' ')}{' '}
                    {lastWord && <span className="gradient-text text-glow-subtle">{lastWord}</span>}
                  </>
                );
              })()
            ) : (
              title
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-surface-600 dark:text-surface-300 mb-6 font-light leading-relaxed"
          >
            {subtitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base md:text-lg text-surface-600 dark:text-surface-300 max-w-3xl mx-auto leading-relaxed"
          >
            {description}
          </motion.p>
        </div>
      </div>

      <div className="absolute bottom-0 start-0 end-0 h-32 bg-gradient-to-t from-surface-100 dark:from-surface-950 to-transparent z-20"></div>
    </section>
  );
};
