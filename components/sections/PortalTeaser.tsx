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

const features = [
  { icon: MessageSquareText, key: 'requests' },
  { icon: Clock, key: 'realtime' },
  { icon: FileCheck, key: 'files' },
  { icon: Bell, key: 'updates' },
] as const;

export const PortalTeaser: React.FC = () => {
  const t = useTranslations();

  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-surface-900 via-surface-900 to-surface-950 dark:from-surface-900 dark:via-surface-900 dark:to-surface-950">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 start-0 w-[600px] h-[600px] bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-3xl -translate-x-1/2" />
        <div className="absolute bottom-0 end-0 w-[500px] h-[500px] bg-gradient-to-tl from-accent-500/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6">
              <LayoutDashboard className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-semibold text-primary-400">
                {t('portalTeaser.badge')}
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-6">
              {t('portalTeaser.title')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400">
                {t('portalTeaser.titleSpan')}
              </span>
            </h2>

            <p className="text-lg text-surface-300 leading-relaxed mb-8 max-w-xl">
              {t('portalTeaser.description')}
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-primary-400" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-0.5">
                      {t(`portalTeaser.features.${feature.key}.title`)}
                    </h4>
                    <p className="text-xs text-surface-400 leading-snug">
                      {t(`portalTeaser.features.${feature.key}.description`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/tools/client-portal">
                <Button variant="primary" size="lg" className="w-full sm:w-auto group">
                  <span className="flex items-center gap-2">
                    {t('portalTeaser.cta')}
                    <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                >
                  {t('portalTeaser.secondaryCta')}
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Visual Side - Portal Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Mock Portal Dashboard */}
            <div className="relative rounded-2xl bg-surface-800/80 border border-surface-700/50 shadow-2xl overflow-hidden backdrop-blur-sm">
              {/* Window Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-700/50 bg-surface-800/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-surface-700/50 text-xs text-surface-400">
                    portal.cartshift.co
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-4 md:p-6 space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t('portalTeaser.preview.active'), value: '3' },
                    { label: t('portalTeaser.preview.pending'), value: '1' },
                    { label: t('portalTeaser.preview.completed'), value: '12' },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-surface-700/30 border border-surface-600/30 text-center"
                    >
                      <div className="text-xl md:text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-surface-400">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Request Cards */}
                <div className="space-y-2">
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
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-surface-700/20 border border-surface-600/20 hover:border-surface-500/30 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full ${request.color}`} />
                      <span className="flex-1 text-sm text-surface-200 truncate">
                        {request.title}
                      </span>
                      <ArrowRight className="w-4 h-4 text-surface-500 rtl:rotate-180" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating elements for depth */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, type: 'spring' }}
              className="absolute -top-4 -end-4 p-3 rounded-xl bg-green-500/20 border border-green-500/30 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium text-green-400">
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
