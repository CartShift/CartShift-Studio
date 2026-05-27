'use client';

import React from 'react';
import Image from 'next/image';
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
  backgroundImage?: string;
  backgroundImageAlt?: string;
  backgroundImagePriority?: boolean;
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
  backgroundImage,
  backgroundImageAlt = '',
  backgroundImagePriority = false,
}) => {
  const hasBackgroundImage = Boolean(backgroundImage);

  return (
    <section
      className={cn(
        'relative min-h-[60vh] flex items-center justify-center pt-32 sm:pt-40 pb-16 md:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-background dark:bg-black transition-colors duration-500',
        hasBackgroundImage && 'min-h-[66vh]'
      )}
    >
      {/* Immersive Background */}
      {backgroundImage ? (
        <>
          <Image
            src={backgroundImage}
            alt={backgroundImageAlt}
            fill
            priority={backgroundImagePriority}
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/74 to-black/88" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.14),transparent_34%)]" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.08]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-white via-surface-50 to-surface-100 dark:from-black dark:via-black dark:to-surface-950 transition-colors duration-500" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04] dark:opacity-[0.07] transition-opacity duration-500" />

          <HeroBlob className="top-[-10%] -start-20 w-[600px] h-[600px] bg-primary-500/20 dark:bg-primary-500/10" />
          <HeroBlob
            className="bottom-[-10%] -end-20 w-[500px] h-[500px] bg-accent-500/20 dark:bg-accent-600/10"
            delay={2}
          />
        </>
      )}

      <div className="max-w-7xl mx-auto relative z-10 w-full group">
        <div className="max-w-4xl mx-auto text-center">
          {badge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={cn(
                'inline-flex items-center gap-2.5 px-5 py-2 rounded-full border backdrop-blur-xl mb-10 shadow-premium transition-transform duration-300',
                hasBackgroundImage
                  ? 'bg-black/35 border-white/15 text-white'
                  : 'bg-white/80 dark:bg-white/5 border-surface-200/60 dark:border-white/10'
              )}
            >
              <Sparkles className="w-4 h-4 text-accent-500" />
              <span
                className={cn(
                  'text-sm font-bold tracking-tight uppercase',
                  hasBackgroundImage ? 'text-white' : 'text-surface-700 dark:text-surface-200'
                )}
              >
                {badge}
              </span>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'font-display font-bold leading-[1.1] tracking-tight mb-8 transition-colors duration-500',
              hasBackgroundImage ? 'text-white drop-shadow-2xl' : 'text-surface-900 dark:text-white',
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
            <p
              className={cn(
                'text-2xl md:text-3xl font-display leading-tight font-medium transition-colors',
                hasBackgroundImage ? 'text-white/88' : 'text-surface-600 dark:text-surface-300'
              )}
            >
              {subtitle}
            </p>
            <p
              className={cn(
                'text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light transition-colors',
                hasBackgroundImage ? 'text-white/72' : 'text-surface-500 dark:text-surface-400'
              )}
            >
              {description}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Hero Bottom Mask */}
      <div
        className={cn(
          'absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t to-transparent z-sticky',
          hasBackgroundImage
            ? 'from-surface-50 via-surface-50/80 dark:from-black dark:via-black/80'
            : 'from-background dark:from-black via-background/60 dark:via-black/60'
        )}
      />
    </section>
  );
};
