'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  LayoutDashboard,
  MessageSquareText,
  Clock,
  FileCheck,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  { icon: MessageSquareText, key: 'requests' },
  { icon: Clock, key: 'realtime' },
  { icon: FileCheck, key: 'files' },
  { icon: Bell, key: 'updates' },
] as const;

export const PortalTeaser: React.FC = () => {
  const t = useTranslations();

  return (
    <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background dark:bg-surface-950 transition-colors duration-500">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 start-0 w-[600px] h-[600px] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[120px] -translate-x-1/2" />
        <div className="absolute bottom-0 end-0 w-[500px] h-[500px] bg-accent-500/10 dark:bg-accent-500/5 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8"
            >
              <LayoutDashboard className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                {t('portalTeaser.badge')}
              </span>
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-display font-black text-surface-900 dark:text-white leading-[1.1] mb-8 tracking-tight">
              {t('portalTeaser.title')}
              <br />
              <span className="gradient-text">{t('portalTeaser.titleSpan')}</span>
            </h2>

            <p className="text-xl text-surface-600 dark:text-surface-300 leading-relaxed mb-10 max-w-xl font-light">
              {t('portalTeaser.description')}
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-6 mb-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col gap-4 p-6 rounded-3xl bg-white/60 dark:bg-white/5 border border-surface-200/50 dark:border-white/5 transition-all duration-500"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <feature.icon size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">
                      {t(`portalTeaser.features.${feature.key}.title`)}
                    </h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed font-light">
                      {t(`portalTeaser.features.${feature.key}.description`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/tools/client-portal">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 font-bold group shadow-premium bg-primary-600 hover:bg-primary-700"
                >
                  <span className="flex items-center gap-3">
                    {t('portalTeaser.cta')}
                    <ArrowRight className="w-5 h-5 rtl:rotate-180 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 font-bold border-surface-300 dark:border-white/10 text-surface-700 dark:text-white hover:bg-surface-100 dark:hover:bg-white/10"
                >
                  {t('portalTeaser.secondaryCta')}
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Visual Side - Portal Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 30 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Mock Portal Dashboard */}
            <div className="relative rounded-[2.5rem] bg-white dark:bg-surface-900 border border-surface-200 dark:border-white/10 shadow-premium overflow-hidden backdrop-blur-xl">
              {/* Window Header */}
              <div className="flex items-center gap-4 px-6 py-4 border-b border-surface-200 dark:border-white/10 bg-surface-50/50 dark:bg-surface-800/30">
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-400/80" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-400/80" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-6 py-1.5 rounded-full bg-surface-200/50 dark:bg-surface-700/50 text-xs font-medium text-surface-500 dark:text-surface-400">
                    portal.cartshift.studio
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-8 md:p-10 space-y-8">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: t('portalTeaser.preview.active'),
                      value: '3',
                      color: 'text-primary-600 dark:text-primary-400',
                    },
                    {
                      label: t('portalTeaser.preview.pending'),
                      value: '1',
                      color: 'text-yellow-600 dark:text-yellow-400',
                    },
                    {
                      label: t('portalTeaser.preview.completed'),
                      value: '12',
                      color: 'text-green-600 dark:text-green-400',
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl bg-surface-100/50 dark:bg-white/5 border border-surface-200/50 dark:border-white/5 text-center transition-transform"
                    >
                      <div className={cn('text-2xl md:text-3xl font-black mb-1', stat.color)}>
                        {stat.value}
                      </div>
                      <div className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-widest">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Request Cards */}
                <div className="space-y-4">
                  {[
                    {
                      status: 'in-progress',
                      title: t('portalTeaser.preview.request1'),
                      color: 'bg-primary-500',
                    },
                    {
                      status: 'pending',
                      title: t('portalTeaser.preview.request2'),
                      color: 'bg-yellow-500',
                    },
                    {
                      status: 'review',
                      title: t('portalTeaser.preview.request3'),
                      color: 'bg-accent-500',
                    },
                  ].map((request, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-4 p-5 rounded-2xl bg-surface-100/50 dark:bg-white/5 border border-surface-200/50 dark:border-white/5 transition-all duration-300 group/item"
                    >
                      <div
                        className={cn(
                          'w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]',
                          request.color
                        )}
                      />
                      <span className="flex-1 text-sm font-medium text-surface-700 dark:text-surface-200">
                        {request.title}
                      </span>
                      <ArrowRight className="w-4 h-4 text-surface-400 group-hover/item:translate-x-1 transition-transform rtl:rotate-180" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Live Update Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, type: 'spring' }}
              className="absolute -top-6 -end-6 p-4 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-white/10 shadow-premium backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-400 animate-pulse ring-4 ring-green-500/20" />
                <span className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-widest">
                  {t('portalTeaser.preview.liveUpdates')}
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
