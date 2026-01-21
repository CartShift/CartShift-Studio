'use client';

import { Suspense, lazy, useMemo, useState, useEffect } from 'react';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { Clock, AlertCircle, ChevronDown } from 'lucide-react';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTranslations, NextIntlClientProvider } from 'next-intl';
import { QuickActions } from '@/components/portal/QuickActions';
import { TipsCard } from '@/components/portal/TipsCard';
import { DashboardSkeleton } from '@/components/portal/skeletons';
import { PinnedRequests } from '@/components/portal/PinnedRequests';
import { motion } from '@/lib/motion';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

// Lazy load the ActivityTimeline for better initial load
const ActivityTimeline = lazy(() =>
  import('@/components/portal/ActivityTimeline').then(mod => ({
    default: mod.ActivityTimeline,
  }))
);

// Helper to get time-based greeting key
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

  // Use the new TanStack Query hook
  const { requests, activities, loading, error, orgId, userData } = useDashboardData();

  // Memoize greeting to prevent recalculation
  const greeting = useMemo(() => {
    const key = getGreetingKey();
    const firstName = userData?.name?.split(' ')[0] || '';
    return t(`dashboard.greeting.${key}` as any, { name: firstName } as any);
  }, [t, userData?.name]);

  // Collapsible Service Status Logic
  const [isServiceStatusOpen, setIsServiceStatusOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('cartshift_service_status_open');
    if (saved !== null) {
      setIsServiceStatusOpen(saved === 'true');
    }
  }, []);

  const toggleServiceStatus = () => {
    const newState = !isServiceStatusOpen;
    setIsServiceStatusOpen(newState);
    localStorage.setItem('cartshift_service_status_open', String(newState));
  };

  if (loading) {
    return (
      <>
        {/* Show QuickActions optimistically while loading */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="h-9 w-64 bg-surface-200 dark:bg-surface-800 rounded-lg animate-pulse" />
              <div className="h-5 w-80 bg-surface-100 dark:bg-surface-800/50 rounded-lg animate-pulse" />
            </div>
          </div>
          <QuickActions />
        </div>
        <div className="mt-8">
          <DashboardSkeleton />
        </div>
      </>
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header with Personalized Greeting */}
      <motion.div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white font-outfit flex items-center gap-3">
            <span className="text-gradient-brand">{greeting}</span>
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1 font-medium">
            {t('dashboard.subtitle')}
          </p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Pinned Requests & Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pinned Requests - Top Priority */}
          <PinnedRequests
            requests={requests}
            orgId={orgId ?? ''}
            locale={locale}
            isAgency={userData?.isAgency ?? false}
          />

          {/* Recent Activity */}
          <Card variant="glass" noPadding className="overflow-hidden">
            <CardSectionTitle
              as="h2"
              className="mb-0 px-6 pt-6 pb-4 border-b border-surface-100 dark:border-surface-800"
            >
              {t('activity.title')}
            </CardSectionTitle>
            <Suspense
              fallback={
                <div className="p-6 space-y-4">
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

        {/* Sidebar Info: Tips & Status */}
        <div className="space-y-6">
          {/* Tips Card */}
          <TipsCard />

          {/* Service Status */}
          <Card
            variant="elevated"
            accent="primary"
            className="shadow-lg transition-all duration-300"
          >
            <button
              onClick={toggleServiceStatus}
              className="w-full flex items-center justify-between group"
            >
              <CardSectionTitle
                as="h4"
                icon={Clock}
                iconClassName="text-blue-500"
                className="mb-0 group-hover:text-primary-600 transition-colors"
              >
                {t('dashboard.serviceStatus.title')}
              </CardSectionTitle>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-surface-400 transition-transform duration-200',
                  isServiceStatusOpen ? 'rotate-180' : 'rotate-0'
                )}
              />
            </button>

            <motion.div
              initial={false}
              animate={{
                height: isServiceStatusOpen ? 'auto' : 0,
                opacity: isServiceStatusOpen ? 1 : 0,
                marginBottom: isServiceStatusOpen ? 24 : 0,
              }}
              className="overflow-hidden"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="pt-6 space-y-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-600 dark:text-surface-400 font-bold font-outfit">
                    {t('dashboard.serviceStatus.design')}
                  </span>
                  <span className="text-emerald-500 font-black flex items-center gap-2 text-[10px] uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {t('dashboard.serviceStatus.active')}
                  </span>
                </div>
                <Card variant="glass" padding="lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-surface-600 dark:text-surface-400 font-bold font-outfit">
                      {t('dashboard.serviceStatus.dev')}
                    </span>
                    <span className="text-amber-500 font-black flex items-center gap-2 text-[10px] uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                      {t('dashboard.serviceStatus.peak')}
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-amber-500"
                      initial={{ width: 0 }}
                      animate={{ width: '92%' }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    />
                  </div>
                  <p className="mt-3 text-[10px] text-surface-400 font-bold uppercase tracking-tight">
                    {t('dashboard.serviceStatus.etaLabel')}: 4-6 {t('dashboard.serviceStatus.days')}
                  </p>
                </Card>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-surface-600 dark:text-surface-400 font-bold font-outfit">
                    {t('dashboard.serviceStatus.avgResponse')}
                  </span>
                  <span className="text-surface-900 dark:text-white font-black text-[10px] uppercase tracking-widest">
                    {t('dashboard.serviceStatus.responseTime')}
                  </span>
                </div>
              </div>
            </motion.div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient({
  messages,
  locale,
}: {
  messages: Record<string, any>;
  locale: string;
}) {
  if (!messages || !locale) {
    throw new Error('DashboardClient requires messages and locale props');
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale as 'en' | 'he'}>
      <DashboardClientContent />
    </NextIntlClientProvider>
  );
}
