'use client';

import { motion } from '@/lib/motion';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { BackgroundShapes } from '@/components/ui/BackgroundShapes';
import { heroContent } from '@/lib/animation-variants';
import { useTranslations } from 'next-intl';
import { useDirection } from '@/lib/i18n-utils';
import { getScheduleUrl } from '@/lib/schedule';
import { trackBookCallClick } from '@/lib/analytics';
import { ArrowRight, ArrowDown } from 'lucide-react';
import Image from 'next/image';
import { HeroIllustration } from './HeroIllustration';
import { cn } from '@/lib/utils';

const platformIcons = [
  { name: 'Shopify', iconPath: '/icons/shopify.svg', color: '#96BF48' },
  { name: 'WordPress', iconPath: '/icons/wordpress.svg', color: '#21759B' },
  { name: 'Wix', iconPath: '/icons/wix.svg', color: '#0C6EFC' },
  { name: 'Webflow', iconPath: '/icons/webflow.svg', color: '#4353FF' },
  { name: 'BigCommerce', iconPath: '/icons/bigcommerce.svg', color: '#121118' },
  { name: 'Squarespace', iconPath: '/icons/squarespace.svg', color: '#000000' },
];

const AmbientLight = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{
      opacity: [0.14, 0.22, 0.14],
      scale: [1, 1.04, 1],
      x: [0, 10, 0],
      y: [0, -8, 0],
    }}
    transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay }}
    className={cn(
      'absolute rounded-full blur-[110px] pointer-events-none transform-gpu will-change-transform',
      className
    )}
  />
);

export const Hero: React.FC = () => {
  const t = useTranslations();
  const direction = useDirection();
  const isRtl = direction === 'rtl';

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center pt-28 md:pt-32 pb-8 md:pb-12 px-4 sm:px-6 lg:px-12 overflow-hidden bg-background dark:bg-surface-950 transition-colors duration-500">
      {/* Immersive Background System */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-surface-50 to-surface-100 dark:from-surface-950 dark:via-surface-950 dark:to-surface-900 transition-colors duration-500" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] dark:opacity-[0.08]" />

      {/* Strategic Ambient Lights */}
      <AmbientLight className="top-[-10%] -start-20 w-[600px] h-[600px] bg-primary-500/20 dark:bg-primary-500/10" />
      <AmbientLight
        className="bottom-[-10%] -end-20 w-[500px] h-[500px] bg-accent-500/20 dark:bg-accent-600/10"
        delay={2}
      />

      {/* Floating geometric shapes */}
      <BackgroundShapes />

      <div className="max-w-[1440px] mx-auto relative z-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="space-y-12 md:space-y-16">
            <div className="space-y-8">
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black leading-[0.95] tracking-tight text-surface-900 dark:text-white">
                {t('hero.titleLine1')}
                <br />
                <span className="gradient-text">{t('hero.titleLine2')}</span>
              </h1>

              <p className="text-lg md:text-xl text-surface-600 dark:text-surface-300 leading-relaxed max-w-xl font-light">
                {t('hero.description')}
              </p>
            </div>

            <motion.div
              className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6"
              initial="hidden"
              animate="visible"
              variants={heroContent}
              custom={0.6}
            >
              <a
                href={getScheduleUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackBookCallClick('hero_cta')}
                className="w-full sm:w-auto"
              >
                <Button
                  size="lg"
                  className="group h-14 md:h-16 px-10 md:px-12 text-lg font-bold shadow-2xl shadow-primary-500/20 hover:shadow-primary-500/40 w-full sm:w-auto"
                >
                  <span className="flex items-center gap-3">
                    {t('hero.primaryCta')}
                    <ArrowRight
                      className={cn(
                        'w-5 h-5 transition-transform group-hover:translate-x-1',
                        isRtl && 'rotate-180 group-hover:-translate-x-1'
                      )}
                      strokeWidth={3}
                    />
                  </span>
                </Button>
              </a>
              <Link href="/tools/store-analyzer" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 md:h-16 px-10 md:px-12 text-lg font-bold bg-white/50 dark:bg-white/5 backdrop-blur-md border-surface-200 dark:border-white/10 hover:bg-surface-50 dark:hover:bg-white/10 w-full sm:w-auto transition-all"
                >
                  {t('hero.analyzerCta')}
                </Button>
              </Link>
            </motion.div>

            {/* Platform Trusted Bar */}
            <div className="space-y-6">
              <span className="text-xs uppercase tracking-[0.3em] text-surface-400 dark:text-surface-500 font-bold block">
                {t('hero.platforms.label')}
              </span>
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                {platformIcons.map(platform => (
                  <motion.div
                    key={platform.name}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="group relative"
                    title={platform.name}
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 p-3 md:p-4 rounded-2xl bg-white/70 dark:bg-white/5 border border-surface-200/60 dark:border-white/10 backdrop-blur-md shadow-sm transition-all duration-300">
                      <div className="relative w-full h-full grayscale opacity-50 dark:invert dark:opacity-40 transition-all duration-500">
                        <Image
                          src={platform.iconPath}
                          alt={platform.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block scale-110 xl:scale-125 origin-center">
            <div className="absolute -inset-10 bg-gradient-to-tr from-primary-500/20 to-accent-500/20 blur-[100px] rounded-full dark:opacity-50" />
            <HeroIllustration />
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-12 inset-x-0 hidden sm:flex justify-center z-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-3 text-surface-400 hover:text-primary-500 cursor-pointer transition-colors"
        >
          <span className="text-xs font-black uppercase tracking-[0.3em]">
            {t('hero.scrollIndicator')}
          </span>
          <ArrowDown className="w-6 h-6" strokeWidth={3} />
        </motion.div>
      </motion.div>

      {/* Epic Bottom Fade */}
      <div className="absolute bottom-0 inset-x-0 h-36 md:h-44 bg-gradient-to-t from-background dark:from-surface-950 via-background/80 dark:via-surface-950/80 to-transparent z-0 pointer-events-none" />
    </section>
  );
};
