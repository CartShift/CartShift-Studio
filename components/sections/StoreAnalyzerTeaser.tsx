'use client';

import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BarChart3, Search, Zap, Shield, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  { icon: Zap, key: 'performance' },
  { icon: Search, key: 'seo' },
  { icon: Shield, key: 'trust' },
  { icon: TrendingUp, key: 'conversion' },
] as const;

export const StoreAnalyzerTeaser: React.FC = () => {
  const t = useTranslations();

  return (
    <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background dark:bg-black transition-colors duration-500">
      {/* Immersive Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-1/4 start-0 w-[600px] h-[600px] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[120px] -translate-x-1/2" />
        <div className="absolute top-0 end-0 w-[500px] h-[500px] bg-accent-500/10 dark:bg-accent-500/5 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Mockup Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            {/* High-Fidelity Analyzer Mockup */}
            <div className="relative rounded-[2.5rem] bg-white dark:bg-surface-950 border border-surface-200 dark:border-white/10 shadow-premium overflow-hidden backdrop-blur-xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 opacity-0 transition-opacity duration-700" />

              {/* Window Header */}
              <div className="flex items-center gap-4 px-6 py-4 border-b border-surface-200 dark:border-white/10 bg-surface-50/50 dark:bg-surface-900/30">
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-400/80" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-400/80" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-2 px-6 py-1.5 rounded-full bg-surface-200/50 dark:bg-surface-700/50 text-xs font-medium text-surface-500 dark:text-surface-400">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    analyzer.cartshift.studio
                  </div>
                </div>
              </div>

              {/* Analyzer Dashboard mockup */}
              <div className="p-8 md:p-10 space-y-8">
                {/* Score Visualization */}
                <div className="flex justify-center flex-col items-center gap-4">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
                      <circle
                        cx="96"
                        cy="96"
                        r="84"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="14"
                        className="text-surface-100 dark:text-surface-800"
                      />
                      <motion.circle
                        cx="96"
                        cy="96"
                        r="84"
                        fill="none"
                        stroke="url(#score-gradient)"
                        strokeWidth="14"
                        strokeDasharray="527"
                        initial={{ strokeDashoffset: 527 }}
                        whileInView={{ strokeDashoffset: 68 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--primary-500)" />
                          <stop offset="100%" stopColor="var(--accent-500)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-6xl font-black text-surface-900 dark:text-white tracking-tighter">
                        87
                      </span>
                      <span className="text-xs font-black text-green-500 uppercase tracking-widest mt-1">
                        OPTIMIZED
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { label: 'Performance', score: 92, color: 'bg-primary-500' },
                    { label: 'SEO Authority', score: 76, color: 'bg-accent-500' },
                    { label: 'Core Vitals', score: 88, color: 'bg-green-500' },
                    { label: 'UX Design', score: 91, color: 'bg-indigo-500' },
                  ].map((metric, i) => (
                    <div
                      key={i}
                      className="p-5 bg-surface-50/50 dark:bg-white/5 rounded-2xl border border-surface-200/50 dark:border-white/5 group/metric transition-all duration-300"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-surface-500 dark:text-surface-300 uppercase tracking-wider">
                          {metric.label}
                        </span>
                        <span className="text-sm font-black text-surface-900 dark:text-white">
                          {metric.score}%
                        </span>
                      </div>
                      <div className="h-2 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${metric.score}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.8 + i * 0.1 }}
                          className={cn('h-full rounded-full shadow-sm', metric.color)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instant Report Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, type: 'spring' }}
              className="absolute -bottom-8 -end-8 p-5 rounded-[2rem] bg-white dark:bg-surface-800 border border-surface-200 dark:border-white/10 shadow-premium backdrop-blur-xl"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  <Sparkles size={24} />
                </div>
                <div>
                  <div className="text-lg font-black text-surface-900 dark:text-white leading-tight">
                    Free AI Audit
                  </div>
                  <div className="text-sm font-medium text-surface-500 dark:text-surface-400">
                    Instant performance report
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Content side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8"
            >
              <BarChart3 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                {t('storeAnalyzerTeaser.badge')}
              </span>
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-display font-black text-surface-900 dark:text-white leading-[1.1] mb-8 tracking-tight">
              {t('storeAnalyzerTeaser.title')}
              <br />
              <span className="gradient-text">{t('storeAnalyzerTeaser.titleSpan')}</span>
            </h2>

            <p className="text-xl text-surface-600 dark:text-surface-300 leading-relaxed mb-10 max-w-xl font-light">
              {t('storeAnalyzerTeaser.description')}
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center gap-5 p-5 rounded-2xl bg-white/60 dark:bg-white/5 border border-surface-200/50 dark:border-white/5 transition-all duration-500"
                >
                  <div className="w-12 h-12 rounded-[1rem] bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                    <feature.icon size={24} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">
                      {t(`storeAnalyzerTeaser.features.${feature.key}.title`)}
                    </h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed font-light">
                      {t(`storeAnalyzerTeaser.features.${feature.key}.description`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/tools/store-analyzer">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-16 px-10 font-black group shadow-premium bg-primary-600 hover:bg-primary-700"
                >
                  <span className="flex items-center gap-3 text-xl">
                    {t('storeAnalyzerTeaser.cta')}
                    <ArrowRight className="w-6 h-6 rtl:rotate-180 group-hover:translate-x-2 transition-transform" />
                  </span>
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
