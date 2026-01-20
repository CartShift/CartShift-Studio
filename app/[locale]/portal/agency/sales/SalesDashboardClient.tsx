/**
 * Sales Dashboard Client
 *
 * Main sales performance dashboard for agency administrators.
 * Shows comprehensive analytics, revenue trends, and top clients.
 */

'use client';

import { useTranslations } from 'next-intl';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { SalesPerformance } from '@/components/portal/SalesPerformance';
import { Button } from '@/components/ui/Button';
import { Loader2, ShieldCheck, RefreshCw, TrendingUp, Download, BarChart3 } from 'lucide-react';
import { useSalesAnalytics } from '@/lib/hooks/useSalesAnalytics';
import { Card } from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';

export default function SalesDashboardClient() {
  const t = useTranslations('portal');
  const { userData, loading: auth, isAuthenticated, user, isImpersonating } = usePortalAuth();
  const { metrics, loading, refetch } = useSalesAnalytics();

  // Check if there's any sales data
  const hasData = metrics && (metrics.totalRevenue > 0 || metrics.totalProposals > 0);

  if (auth) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-surface-500 font-bold uppercase tracking-widest text-xs">
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
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-surface-500 font-bold uppercase tracking-widest text-xs">
            Redirecting to Client View...
          </p>
        </div>
      );
    }
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-10 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          {t('agency.accessDeniedTitle')}
        </h2>
        <p className="text-surface-500 max-w-sm mx-auto mb-8">
          {t('agency.notRegisteredAsAdmin', { email: user?.email || '' })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white leading-tight">
              {t('sales.dashboard.title')}
            </h1>
          </div>
          <p className="text-surface-500 dark:text-surface-400 ms-[52px]">
            {t('sales.dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('sales.dashboard.refresh')}
          </Button>

          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            {t('sales.dashboard.exportReport')}
          </Button>
        </div>
      </div>

      {/* Empty State or Main Performance Dashboard */}
      {!loading && !hasData ? (
        <Card variant="default" padding="lg">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center mb-6">
              <BarChart3 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
              {t('sales.empty.title')}
            </h3>
            <p className="text-surface-500 dark:text-surface-400 max-w-md mb-6">
              {t('sales.empty.subtitle')}
            </p>
            <p className="text-sm text-surface-400 dark:text-surface-500 mb-6">
              {t('sales.empty.hint')}
            </p>
            <Link href="/portal/agency/pricing">
              <Button variant="primary">{t('agency.pricing.subtitle')}</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <SalesPerformance variant="full" />
      )}
    </div>
  );
}
