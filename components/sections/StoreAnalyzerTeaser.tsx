'use client';

import { motion } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, ArrowRight, ClipboardCheck, ShoppingCart, SearchCheck, Sparkles } from 'lucide-react';

export const StoreAnalyzerTeaser = () => {
  const t = useTranslations('storeReview');
  const checks = [
    { icon: ShoppingCart, label: t('areas.checkout') },
    { icon: SearchCheck, label: t('areas.seo') },
    { icon: ClipboardCheck, label: t('areas.product') },
  ];
  return (
    <section className="relative overflow-hidden bg-background px-4 py-24 dark:bg-surface-950 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -end-32 top-4 h-[450px] w-[450px] rounded-full bg-primary-500/10 blur-[100px]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="order-2 lg:order-1"
        >
          <div className="overflow-hidden rounded-[2rem] border border-surface-200 bg-white shadow-2xl shadow-primary-900/10 dark:border-white/10 dark:bg-surface-900">
            <div className="flex items-center gap-3 border-b border-surface-200 px-6 py-5 dark:border-white/10">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600">
                <Sparkles size={20} />
              </span>
              <div><p className="font-bold text-surface-900 dark:text-white">{t('deliverTitle')}</p>
                <p className="text-xs text-surface-500">CartShift Studio</p>
              </div>
            </div>
            <div className="space-y-6 p-6 sm:p-9">
              <div className="rounded-xl border border-primary-500/15 bg-primary-500/5 p-5">
                <p className="text-sm leading-relaxed text-surface-700 dark:text-surface-200">{t('deliverDescription')}</p>
              </div>
              {checks.map(({ icon: Icon, label }, i) => (
                <div key={label} className="flex items-start gap-4">
                  <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-primary-600 dark:bg-white/10">
                    <Icon size={19}/>
                  </span>
                  <div className="flex-1 border-b border-surface-100 pb-5 dark:border-white/10">
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <span className="font-semibold text-surface-900 dark:text-white">{label}</span>
                      <span className="font-mono text-surface-400">0{i+1}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-surface-500">{t('deliverables.evidence')}</p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-surface-500">{t('finePrint')}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="order-1 space-y-7 lg:order-2">
          <span className="inline-flex rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-600">
            {t('badge')}
          </span>
          <h2 className="text-4xl font-black leading-tight tracking-tight text-surface-900 dark:text-white md:text-5xl">
            {t('title')} <span className="block text-primary-600 dark:text-primary-400">{t('titleHighlight')}</span>
          </h2>
          <p className="max-w-xl text-lg leading-relaxed text-surface-600 dark:text-surface-300">{t('subtitle')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(['findings','roadmap','proposal','evidence'] as const).map(key => (
              <p key={key} className="flex items-start gap-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary-600" /> {t(`deliverables.${key}`)}
              </p>
            ))}
          </div>
          <Link href="/free-store-review" className="inline-block">
            <Button size="lg" className="h-14 px-8 text-base">
              {t('submit')} <ArrowRight className="size-5 rtl:rotate-180"/>
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
