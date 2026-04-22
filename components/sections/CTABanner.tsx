'use client';

import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useDirection } from '@/lib/i18n-utils';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CTABanner: React.FC = () => {
  const t = useTranslations();
  const direction = useDirection();
  const isRtl = direction === 'rtl';

  return (
    <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-background dark:bg-surface-950 transition-colors duration-500">
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 dark:from-primary-500/10 dark:to-accent-500/10" />
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.08]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {/* Animated Gradient Border Overlay */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-[3rem] opacity-50 dark:opacity-30 blur-sm group-hover:opacity-100 transition-opacity" />

          <div className="relative rounded-[2.5rem] md:rounded-[3.5rem] p-10 md:p-20 bg-white/80 dark:bg-surface-900/80 backdrop-blur-3xl border border-white/20 dark:border-white/10 text-center overflow-hidden shadow-premium">
            {/* Inner Glow */}
            <div className="absolute top-0 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px]" />

            <div className="relative z-10 space-y-10">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-surface-100 dark:bg-white/5 border border-surface-200 dark:border-white/10"
              >
                <Sparkles size={16} className="text-accent-500" />
                <span className="text-xs font-bold text-surface-600 dark:text-surface-300 uppercase tracking-widest">
                  {t('ctaBanner.badge' as any) || 'Ready to Scale?'}
                </span>
              </motion.div>

              <h2 className="text-4xl sm:text-5xl md:text-7xl font-display font-black text-surface-900 dark:text-white leading-[1.05] tracking-tight">
                {t('ctaBanner.titlePart1')}
                <br />
                <span className="gradient-text">{t('ctaBanner.titlePart2')}</span>
              </h2>

              <p className="text-xl md:text-2xl text-surface-600 dark:text-surface-300 font-light leading-relaxed max-w-2xl mx-auto">
                {t('ctaBanner.description')}
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="pt-6"
              >
                <Link href="/contact">
                  <Button
                    size="lg"
                    className="h-20 px-12 md:px-16 text-2xl font-black group shadow-glow-primary bg-primary-600 hover:bg-primary-700 transition-all hover:scale-[1.02]"
                  >
                    <span className="flex items-center gap-4">
                      {t('ctaBanner.button')}
                      <ArrowRight
                        size={28}
                        className={cn(
                          'transition-transform group-hover:translate-x-2',
                          isRtl && 'rotate-180 group-hover:-translate-x-2'
                        )}
                        strokeWidth={3}
                      />
                    </span>
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
