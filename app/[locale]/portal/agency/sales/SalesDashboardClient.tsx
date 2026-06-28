'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { SalesPerformance } from '@/components/portal/SalesPerformance';
import { Button } from '@/components/ui/Button';
import { Loader2, ShieldCheck, RefreshCw, TrendingUp, Download, BarChart3 } from 'lucide-react';
import { useSalesAnalytics } from '@/lib/hooks/useSalesAnalytics';
import { Card } from '@/components/ui/Card';
import { Link, usePathname, useRouter, useSearchParams } from '@/i18n/navigation';
import { InsightsPanel } from '@/components/portal/sales/InsightsPanel';
import { ProfitSplitsSection } from '@/components/portal/sales/ProfitSplitsSection';
import {
  SalesDashboardTabBar,
  type SalesDashboardTab,
} from '@/components/portal/sales/SalesDashboardTabBar';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { Select } from '@/components/ui/Select';
import { PortalPageHeader } from '@/components/portal/ui/PortalPageHeader';
import { useCanManageProfitSplits, useProfitSplits } from '@/lib/hooks/useProfitSplits';
import { PROFIT_SPLIT_STATUS } from '@/lib/types/profit-split';

export default function SalesDashboardClient() {
  const t = useTranslations('portal');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userData, loading: auth, isAuthenticated, user, isImpersonating } = usePortalAuth();
  const { canManage: canManageProfitSplits } = useCanManageProfitSplits();
  const { splits } = useProfitSplits();
  const [period, setPeriod] = useState('6');

  const tabParam = searchParams.get('tab');
  const activeTab: SalesDashboardTab =
    tabParam === 'profit-splits' && canManageProfitSplits ? 'profit-splits' : 'overview';

  const { metrics, loading, refetch } = useSalesAnalytics(parseInt(period));

  const draftSplitCount = useMemo(
    () => splits.filter(split => split.status === PROFIT_SPLIT_STATUS.DRAFT).length,
    [splits]
  );

  const hasData =
    metrics && (metrics.totalRevenue > 0 || metrics.totalProposals > 0 || metrics.pendingRevenue > 0);

  const setActiveTab = useCallback(
    (tab: SalesDashboardTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'overview') {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  if (auth) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-xs font-bold uppercase tracking-widest text-surface-500">
          {t('sales.dashboard.loading')}
        </p>
      </div>
    );
  }

  if (
    (!auth && isAuthenticated && !userData?.isAgency && !isImpersonating) ||
    (isImpersonating && userData?.isAgency === false)
  ) {
    if (isImpersonating) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <p className="text-xs font-bold uppercase tracking-widest text-surface-500">
            Redirecting to Client View...
          </p>
        </div>
      );
    }
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-10 text-center">
        <ShieldCheck className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h2 className="mb-2 text-2xl font-bold text-surface-900 dark:text-white">
          {t('agency.accessDeniedTitle')}
        </h2>
        <p className="mx-auto mb-8 max-w-sm text-surface-500">
          {t('agency.notRegisteredAsAdmin', { email: user?.email || '' })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <PortalPageHeader
        title={t('sales.dashboard.title')}
        description={
          activeTab === 'profit-splits'
            ? t('sales.dashboard.profitSplitsSubtitle')
            : t('sales.dashboard.subtitle')
        }
        icon={TrendingUp}
        className="mb-0"
        action={
          activeTab === 'overview' ? (
            <>
              <Select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-[160px]"
                options={[
                  { value: '1', label: t('sales.chart.lastMonth') },
                  { value: '6', label: t('sales.chart.last6Months') },
                  { value: '12', label: t('sales.chart.lastYear') },
                ]}
              />
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={loading}
                leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
              >
                {t('sales.dashboard.refresh')}
              </Button>
              <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
                {t('sales.dashboard.exportReport')}
              </Button>
            </>
          ) : null
        }
      />

      {canManageProfitSplits && (
        <SalesDashboardTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          overviewLabel={t('sales.dashboard.tabs.overview')}
          profitSplitsLabel={t('sales.dashboard.tabs.profitSplits')}
          draftCount={draftSplitCount}
        />
      )}

      {activeTab === 'profit-splits' && canManageProfitSplits ? (
        <ProfitSplitsSection />
      ) : (
        <>
          {!loading && !hasData ? (
            <Card variant="default" padding="lg">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/10">
                  <BarChart3 className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-surface-900 dark:text-white">
                  {t('sales.empty.title')}
                </h3>
                <p className="mb-6 max-w-md text-surface-500 dark:text-surface-400">
                  {t('sales.empty.subtitle')}
                </p>
                <p className="mb-6 text-sm text-surface-400 dark:text-surface-500">
                  {t('sales.empty.hint')}
                </p>
                <Link href={getPortalPath('/requests')}>
                  <Button variant="primary">{t('agency.pricing.subtitle')}</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-5 min-[1040px]:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0">
                <SalesPerformance variant="full" />
              </div>
              <div className="min-w-0">
                {metrics && <InsightsPanel metrics={metrics} loading={loading} />}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
