'use client';

import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BarChart3, Search, Zap, Shield, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

const features = [
  { icon: Zap, key: 'performance' },
  { icon: Search, key: 'seo' },
  { icon: Shield, key: 'trust' },
  { icon: TrendingUp, key: 'conversion' },
] as const;

export const StoreAnalyzerTeaser: React.FC = () => {
  const t = useTranslations();

  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-surface-100 via-surface-50 to-surface-100 dark:from-surface-950 dark:via-surface-950 dark:to-surface-900">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute bottom-1/4 start-0 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/10 dark:from-indigo-500/10 to-transparent rounded-full blur-3xl -translate-x-1/2" />
        <div className="absolute top-0 end-0 w-[500px] h-[500px] bg-gradient-to-bl from-purple-500/10 dark:from-purple-500/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-dropdown">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visual Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            {/* Mock Analyzer Dashboard */}
            <div className="relative rounded-2xl bg-white/80 dark:bg-surface-800/80 border border-surface-200/80 dark:border-surface-700/50 shadow-2xl overflow-hidden backdrop-blur-sm group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              {/* Window Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-200/80 dark:border-surface-700/50 bg-surface-100/50 dark:bg-surface-800/50 relative z-dropdown">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-2 px-4 py-1 rounded-md bg-surface-200/50 dark:bg-surface-700/50 text-xs text-surface-600 dark:text-surface-400 min-w-[200px]">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    yourstore.com
                  </div>
                </div>
              </div>

              {/* Analyzer Content mockup */}
              <div className="p-6 space-y-6 relative z-dropdown">
                {/* Score Circle */}
                <div className="flex justify-center py-4">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        className="text-surface-200 dark:text-surface-700"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeDasharray="440"
                        strokeDashoffset="57"
                        className="text-green-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-bold text-surface-900 dark:text-white">
                        87
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                        GOOD
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-surface-100/50 dark:bg-surface-700/30 rounded-xl border border-surface-200/50 dark:border-surface-600/30 hover:border-surface-300 dark:hover:border-surface-500/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-medium text-surface-700 dark:text-surface-300">
                        Performance
                      </div>
                      <span className="text-xs font-bold text-green-600 dark:text-green-400">
                        92
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div className="h-full w-[92%] bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="p-3 bg-surface-100/50 dark:bg-surface-700/30 rounded-xl border border-surface-200/50 dark:border-surface-600/30 hover:border-surface-300 dark:hover:border-surface-500/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-medium text-surface-700 dark:text-surface-300">
                        SEO
                      </div>
                      <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
                        76
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div className="h-full w-[76%] bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, type: 'spring' }}
              className="absolute -bottom-6 -right-6 p-4 rounded-xl bg-white/90 dark:bg-surface-800/90 border border-indigo-200 dark:border-indigo-500/30 backdrop-blur-md shadow-lg shadow-indigo-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-surface-900 dark:text-white">
                    Free Report
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-300">
                    Instant PDF Download
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 mb-6">
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {t('storeAnalyzerTeaser.badge')}
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-surface-900 dark:text-white leading-tight mb-6">
              {t('storeAnalyzerTeaser.title')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400">
                {t('storeAnalyzerTeaser.titleSpan')}
              </span>
            </h2>

            <p className="text-lg text-surface-600 dark:text-surface-300 leading-relaxed mb-8 max-w-xl">
              {t('storeAnalyzerTeaser.description')}
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-surface-100/50 dark:bg-white/5 border border-surface-200/50 dark:border-white/5 hover:border-surface-300 dark:hover:border-white/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center">
                    <feature.icon
                      className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                      strokeWidth={2}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-0.5">
                      {t(`storeAnalyzerTeaser.features.${feature.key}.title`)}
                    </h3>
                    <p className="text-xs text-surface-500 dark:text-surface-400 leading-snug">
                      {t(`storeAnalyzerTeaser.features.${feature.key}.description`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/tools/store-analyzer">
                <Button
                  as="div"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-none shadow-lg shadow-indigo-500/25"
                >
                  <span className="flex items-center gap-2">
                    {t('storeAnalyzerTeaser.cta')}
                    <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
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
