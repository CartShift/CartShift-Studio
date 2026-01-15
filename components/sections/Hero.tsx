'use client';

import { motion } from '@/lib/motion';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { ParallaxLayer } from '@/components/ui/Parallax';
import { BackgroundShapes } from '@/components/ui/BackgroundShapes';
import {
  fadeInLeft,
  fadeInRight,
  heroTag,
  heroContent,
  heroImage,
  staggerContainer,
  platformIcon,
} from '@/lib/animation-variants';
import { useTranslations } from 'next-intl';
import { useDirection } from '@/lib/i18n-utils';
import { getScheduleUrl } from '@/lib/schedule';
import { trackBookCallClick } from '@/lib/analytics';
import { ArrowRight, ArrowDown, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { HeroIllustration } from './HeroIllustration';

const platformIcons = [
  {
    name: 'Shopify',
    iconPath: '/icons/shopify.svg',
    color: '#96BF48',
  },
  {
    name: 'WordPress',
    iconPath: '/icons/wordpress.svg',
    color: '#21759B',
  },
  {
    name: 'Wix',
    iconPath: '/icons/wix.svg',
    color: '#0C6EFC',
  },
  {
    name: 'Webflow',
    iconPath: '/icons/webflow.svg',
    color: '#4353FF',
  },
  {
    name: 'BigCommerce',
    iconPath: '/icons/bigcommerce.svg',
    color: '#121118',
  },
  {
    name: 'Squarespace',
    iconPath: '/icons/squarespace.svg',
    color: '#000000',
  },
];

export const Hero: React.FC = () => {
  const t = useTranslations();
  const direction = useDirection();
  const isRtl = direction === 'rtl';

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center pt-20 sm:pt-28 md:pt-32 pb-16 md:pb-40 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-surface-100 dark:bg-surface-950">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-100 via-surface-100 to-surface-200 dark:from-surface-950 dark:to-surface-900"></div>
      <div className="absolute top-0 start-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.06] dark:opacity-5"></div>

      {/* Animated Orbs with Parallax - Dramatic 3D depth */}
      <ParallaxLayer depth={2} baseSpeed={0.5}>
        <div className="absolute top-[-15%] start-[-10%] w-[45rem] h-[45rem] bg-primary-500/15 dark:bg-primary-600/15 rounded-full blur-[120px] animate-slow-spin"></div>
      </ParallaxLayer>
      <ParallaxLayer depth={3} baseSpeed={0.4}>
        <div
          className="absolute bottom-[-15%] end-[-10%] w-[45rem] h-[45rem] bg-accent-500/10 dark:bg-accent-600/10 rounded-full blur-[120px] animate-slow-spin"
          style={{ animationDirection: 'reverse' }}
        ></div>
      </ParallaxLayer>

      {/* Floating geometric shapes */}
      <BackgroundShapes />

      <div className="max-w-7xl mx-auto relative z-dropdown w-full pb-4 md:pb-20 lg:pb-0">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={isRtl ? fadeInRight : fadeInLeft}
            className="space-y-8 md:space-y-10"
          >
            <motion.div
              variants={heroTag}
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/90 dark:bg-white/5 border border-surface-300/50 dark:border-white/10 backdrop-blur-md shadow-premium"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-500" />
              <span className="text-surface-700 dark:text-surface-200 text-xs sm:text-sm font-semibold">
                {t('hero.tag')}
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight text-surface-900 dark:text-white">
              {t('hero.titleLine1')}
              <br />
              {t('hero.titleLine2')}
            </h1>

            {/* LCP element - render immediately without animation delay */}
            <p className="text-base sm:text-lg md:text-xl text-surface-600 dark:text-surface-300 leading-relaxed max-w-xl">
              {t('hero.description')}
            </p>

            <motion.div
              className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-5"
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
                  as="div"
                  size="lg"
                  className="group text-base md:text-lg px-8 md:px-10 py-4 md:py-5 min-h-[48px] md:min-h-[52px] shadow-premium hover:shadow-premium-hover w-full sm:w-auto"
                >
                  <span className="relative z-dropdown flex items-center gap-3 justify-center">
                    {t('hero.primaryCta')}
                    <motion.div
                      animate={{ x: isRtl ? [0, -5, 0] : [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight
                        className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`}
                        strokeWidth={2.5}
                      />
                    </motion.div>
                  </span>
                </Button>
              </a>
              <Link href="/tools/store-analyzer" className="w-full sm:w-auto">
                <Button
                  as="div"
                  variant="outline"
                  size="lg"
                  className="text-base md:text-lg px-8 md:px-10 py-4 md:py-5 min-h-[48px] md:min-h-[52px] shadow-premium hover:shadow-premium-hover w-full sm:w-auto"
                >
                  {t('hero.analyzerCta')}
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="pt-8 md:pt-10 border-t border-surface-300/60 dark:border-white/5 flex flex-wrap gap-6 md:gap-12 mb-4 md:mb-6 lg:mb-0"
            >
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-surface-900 dark:text-white mb-1">
                  {t('hero.stats.clients.value')}
                </span>
                <span className="text-xs sm:text-sm md:text-base text-surface-500 dark:text-surface-400 font-medium">
                  {t('hero.stats.clients.label')}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-surface-900 dark:text-white mb-1">
                  {t('hero.stats.dedication.value')}
                </span>
                <span className="text-xs sm:text-sm md:text-base text-surface-500 dark:text-surface-400 font-medium">
                  {t('hero.stats.dedication.label')}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-surface-400 dark:text-surface-500 font-medium mb-4 block">
                  {t('hero.platforms.label')}
                </span>
                <motion.div
                  variants={staggerContainer}
                  className="flex flex-wrap items-center gap-2.5 md:gap-4"
                >
                  {platformIcons.map(platform => (
                    <motion.div
                      key={platform.name}
                      variants={platformIcon}
                      whileHover={{
                        scale: 1.1,
                        transition: { duration: 0.2 },
                      }}
                      className="group relative"
                      title={platform.name}
                    >
                      <div className="w-10 h-10 md:w-11 md:h-11 p-2 md:p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-surface-200/60 dark:border-white/10 backdrop-blur-sm shadow-sm transition-all duration-300 group-hover:border-surface-300 dark:group-hover:border-white/20 group-hover:shadow-md">
                        <div className="relative w-full h-full grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 dark:invert dark:opacity-70 dark:group-hover:invert-0 dark:group-hover:opacity-100">
                          <Image
                            src={platform.iconPath}
                            alt={`${platform.name} logo`}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={heroImage}
            className="relative hidden lg:block"
          >
            <HeroIllustration />
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator - Hidden on small mobile heights to avoid overlap */}
      <motion.div
        className="absolute bottom-8 md:bottom-12 lg:bottom-16 inset-x-0 hidden sm:flex justify-center z-header pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <motion.div
          className="flex flex-col items-center gap-2 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors cursor-pointer pointer-events-auto"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-sm font-medium text-center">{t('hero.scrollIndicator')}</span>
          <ArrowDown className="w-6 h-6" strokeWidth={2} />
        </motion.div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 start-0 end-0 h-40 bg-gradient-to-t from-surface-100 dark:from-surface-950 via-surface-100/60 dark:via-surface-950/50 to-transparent z-sticky"></div>
    </section>
  );
};
