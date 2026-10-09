'use client';

import { Suspense, lazy, useMemo, useState, useEffect } from 'react';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { Clock, AlertCircle, ChevronDown, Sparkles } from 'lucide-react';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTranslations, NextIntlClientProvider } from 'next-intl';
import { QuickActions } from '@/components/portal/QuickActions';
import { ProjectHighlights } from '@/components/portal/projects/ProjectHighlights';
import { TipsCard } from '@/components/portal/TipsCard';
import { DashboardSkeleton } from '@/components/portal/skeletons';
import { PinnedRequests } from '@/components/portal/PinnedRequests';
import { motion } from '@/lib/motion';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PortalPageHeader } from '@/components/portal/ui/PortalPageHeader';

const ActivityTimeline = lazy(() =>
  import('@/components/portal/ActivityTimeline').then(mod => ({
    default: mod.ActivityTimeline,
  }))
);

function getGreetingKey(): 'morning' | 'afternoon' | 'evening' | 'default' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'default';
}

function DashboardClientContent() {
  const t = useTranslations('portal');
  const params = useParams();
  const locale = (typeof params.locale === 'string' ? params.locale : 'en') as 'en' | 'he';

  const { requests, activities, loading, error, orgId, userData } = useDashboardData();

  const greeting = useMemo(() => {
    const key = getGreetingKey();
    const firstName = userData?.name?.split(' ')[0] || '';
    return t(`dashboard.greeting.${key}`, { name: firstName });
  }, [t, userData?.name]);

  const [isSecondaryOpen, setIsSecondaryOpen] = useState(false);

  useEffect(() => {
    const savedSecondary = localStorage.getItem('cartshift_dashboard_secondary_open');
    if (savedSecondary !== null) {
      setIsSecondaryOpen(savedSecondary === 'true');
    }
  }, []);

  const toggleSecondary = () => {
    const next = !isSecondaryOpen;
    setIsSecondaryOpen(next);
    localStorage.setItem('cartshift_dashboard_secondary_open', String(next));
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="h-9 w-64 bg-surface-200 dark:bg-surface-800 rounded-lg animate-pulse" />
          <div className="h-5 w-80 bg-surface-100 dark:bg-surface-800/50 rounded-lg animate-pulse" />
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
          {t('dashboard.error.title')}
        </h2>
        <p className="text-surface-500 max-w-sm">
          {error === 'access_denied' ? t('access.restrictedMessage') : t('common.error')}
        </p>
        <Button onClick={() => window.location.reload()}>{t('dashboard.error.retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PortalPageHeader
          title={greeting}
          description={t('dashboard.subtitle')}
          className="mb-0"
          action={
            <div className="hidden w-full md:block md:max-w-md lg:max-w-lg">
              <QuickActions />
            </div>
          }
        />
      </motion.div>

      <ProjectHighlights />

      <PinnedRequests
        requests={requests}
        orgId={orgId ?? ''}
        locale={locale}
        isAgency={userData?.isAgency ?? false}
      />

      <div className="md:hidden">
        <QuickActions />
      </div>

      <div className="grid grid-cols-1 min-[1040px]:grid-cols-[minmax(0,1fr)_300px] gap-5">
        <div className="min-w-0">
          <Card variant="glass" noPadding className="overflow-hidden">
            <CardSectionTitle
              as="h2"
              className="mb-0 px-5 pt-5 pb-3.5 border-b border-surface-100 dark:border-surface-800"
            >
              {t('activity.title')}
            </CardSectionTitle>
            <Suspense
              fallback={
                <div className="p-5 space-y-3.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-4 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-surface-200 dark:bg-surface-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 bg-surface-200 dark:bg-surface-800 rounded" />
                        <div className="h-3 w-56 bg-surface-100 dark:bg-surface-800/50 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <ActivityTimeline activities={activities} orgId={orgId ?? ''} showFilters />
            </Suspense>
          </Card>
        </div>

        <div className="min-w-0 space-y-3.5">
          <button
            type="button"
            onClick={toggleSecondary}
            className="portal-focus-ring w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50/80 dark:bg-surface-900/40 text-start touch-target-sm"
            aria-expanded={isSecondaryOpen}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-300">
              <Sparkles className="w-4 h-4 text-primary-500" aria-hidden />
              {isSecondaryOpen
                ? t('dashboard.secondaryPanel.hide')
                : t('dashboard.secondaryPanel.show')}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-surface-400 transition-transform duration-200',
                isSecondaryOpen && 'rotate-180'
              )}
              aria-hidden
            />
          </button>

          {isSecondaryOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 overflow-hidden"
            >
              <TipsCard />

              <Card variant="elevated" accent="primary" className="shadow-sm">
                <CardSectionTitle as="h4" icon={Clock} className="mb-3">
                  {t('dashboard.projectWork.title')}
                </CardSectionTitle>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between gap-3">
                    <span className="text-surface-600 dark:text-surface-300">{t('dashboard.projectWork.open')}</span>
                    <strong>{requests.filter(r => !['DELIVERED', 'PAID', 'CLOSED', 'CANCELED', 'DECLINED', 'EXPIRED'].includes(r.status)).length}</strong>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span className="text-surface-600 dark:text-surface-300">{t('dashboard.projectWork.action')}</span>
                    <strong>{requests.filter(r => ['NEEDS_INFO', 'CHANGES_REQUESTED', 'QUOTED'].includes(r.status)).length}</strong>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span className="text-surface-600 dark:text-surface-300">{t('dashboard.projectWork.review')}</span>
                    <strong>{requests.filter(r => r.status === 'IN_REVIEW').length}</strong>
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient({
  messages,
  locale,
}: {
  messages: Record<string, unknown>;
  locale: string;
}) {
  if (!messages || !locale) {
    throw new Error('DashboardClient requires messages and locale props');
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale as 'en' | 'he'} timeZone="UTC">
      <DashboardClientContent />
    </NextIntlClientProvider>
  );
}
