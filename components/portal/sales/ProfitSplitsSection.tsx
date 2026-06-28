'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertTriangle,
  CheckCircle2,
  HandCoins,
  Loader2,
  Pencil,
  PieChart,
  RefreshCw,
  WalletCards,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { ProfitSplitEditor } from '@/components/portal/profit-splits/ProfitSplitEditor';
import { ProfitSplitMetricCard } from '@/components/portal/profit-splits/ProfitSplitMetricCard';
import {
  usePaidPricingRequestsForProfitSplits,
  useProfitSplitAgencyTeam,
  useProfitSplits,
} from '@/lib/hooks/useProfitSplits';
import { formatCurrency } from '@/lib/types/pricing';
import { PROFIT_SPLIT_STATUS, ProfitSplit } from '@/lib/types/profit-split';
import { cn } from '@/lib/utils';
import {
  allocationTone,
  buildEmployeeSummary,
  dateLabel,
  formatCurrencyBreakdown,
  summarizeByCurrency,
} from '@/lib/utils/profit-split-ui';
import {
  PortalTable,
  PortalTableScroll,
  PortalTableElement,
  PortalTableHeader,
  PortalTableBody,
  PortalTableRow,
  PortalTableHead,
  PortalTableCell,
} from '@/components/portal/ui/PortalTable';
import { IconButton } from '@/components/ui/IconButton';

export function ProfitSplitsSection() {
  const t = useTranslations('portal');
  const locale = useLocale();
  const { splits, loading, error, refetch } = useProfitSplits();
  const { paidRequests, error: paidRequestsError } = usePaidPricingRequestsForProfitSplits();
  const { error: agencyTeamError } = useProfitSplitAgencyTeam();
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<ProfitSplit | null>(null);
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<'all' | 'draft' | 'finalized'>(
    'all'
  );

  const primaryCurrency = splits[0]?.currency || paidRequests[0]?.currency || 'USD';
  const summary = useMemo(
    () => ({
      totalNetProfit: summarizeByCurrency(splits, split => split.netProfit),
      totalAllocated: summarizeByCurrency(splits, split => split.totalAllocatedAmount),
      unallocated: summarizeByCurrency(splits, split => split.unallocatedAmount),
      finalized: splits.filter(split => split.status === PROFIT_SPLIT_STATUS.FINALIZED).length,
      drafts: splits.filter(split => split.status === PROFIT_SPLIT_STATUS.DRAFT).length,
    }),
    [splits]
  );
  const loadError = error || paidRequestsError || agencyTeamError;

  const employeeSplits = useMemo(
    () =>
      splits.filter(split =>
        employeeStatusFilter === 'all' ? true : split.status === employeeStatusFilter
      ),
    [employeeStatusFilter, splits]
  );
  const employeeSummary = useMemo(() => buildEmployeeSummary(employeeSplits), [employeeSplits]);

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-surface-900 dark:text-white">
            {t('profitSplits.title')}
          </h2>
          <p className="mt-1 text-sm text-surface-500">{t('profitSplits.subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          {t('common.refresh')}
        </Button>
      </div>

      <div className="grid gap-3.5 md:grid-cols-2 min-[1040px]:grid-cols-5">
        <ProfitSplitMetricCard
          label={t('profitSplits.totalNetProfit')}
          value={formatCurrencyBreakdown(summary.totalNetProfit, primaryCurrency)}
          icon={<WalletCards className="h-5 w-5" />}
          tone="emerald"
        />
        <ProfitSplitMetricCard
          label={t('profitSplits.totalAllocated')}
          value={formatCurrencyBreakdown(summary.totalAllocated, primaryCurrency)}
          icon={<HandCoins className="h-5 w-5" />}
          tone="blue"
        />
        <ProfitSplitMetricCard
          label={t('profitSplits.unallocated')}
          value={formatCurrencyBreakdown(summary.unallocated, primaryCurrency)}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone={
            Object.values(summary.unallocated).every(amount => amount === 0) ? 'purple' : 'amber'
          }
        />
        <ProfitSplitMetricCard
          label={t('profitSplits.finalizedSplits')}
          value={summary.finalized.toString()}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="purple"
        />
        <ProfitSplitMetricCard
          label={t('profitSplits.draftSplits')}
          value={summary.drafts.toString()}
          icon={<Pencil className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="border-b border-surface-100 bg-surface-50/60 p-4 dark:border-surface-800 dark:bg-surface-900/40">
          <h3 className="text-base font-black text-surface-900 dark:text-white">
            {t('profitSplits.projects')}
          </h3>
        </div>

        {loadError ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
            <p className="max-w-md text-sm font-bold text-rose-700 dark:text-rose-300">
              {t('profitSplits.loadError')}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              {t('common.retry')}
            </Button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <p className="text-sm font-bold text-surface-400">{t('common.loading')}</p>
          </div>
        ) : splits.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-50 dark:bg-surface-900">
              <PieChart className="h-10 w-10 text-surface-300" />
            </div>
            <h3 className="text-xl font-bold text-surface-900 dark:text-white">
              {t('profitSplits.emptyTitle')}
            </h3>
            <p className="mt-2 max-w-md text-sm font-medium text-surface-500">
              {t('profitSplits.emptySubtitle')}
            </p>
          </div>
        ) : (
          <PortalTable className="border-0 shadow-none bg-transparent rounded-none overflow-visible">
            <PortalTableScroll>
              <PortalTableElement className="min-w-[980px]">
                <PortalTableHeader className="bg-surface-50/50 dark:bg-surface-900/50">
                  <PortalTableRow className="cursor-default">
                    {[
                      t('profitSplits.projectTitle'),
                      t('profitSplits.client'),
                      t('profitSplits.grossRevenue'),
                      t('profitSplits.expenses'),
                      t('profitSplits.netProfit'),
                      t('profitSplits.allocationStatus'),
                      t('common.status'),
                      t('profitSplits.updated'),
                    ].map(label => (
                      <PortalTableHead key={label} headStyle="default" className="px-5">
                        {label}
                      </PortalTableHead>
                    ))}
                    <PortalTableHead headStyle="default" cellAlign="end" className="px-5">
                      {t('common.actions')}
                    </PortalTableHead>
                  </PortalTableRow>
                </PortalTableHeader>
                <PortalTableBody>
                  {splits.map(split => {
                    const tone = allocationTone(split);

                    return (
                      <PortalTableRow key={split.id} hover className="transition-colors">
                        <PortalTableCell className="px-5">
                          <div className="max-w-xs">
                            <p className="truncate font-bold text-surface-900 dark:text-white">
                              {split.projectTitle}
                            </p>
                            <p className="mt-1 font-mono text-xs text-surface-400">
                              {split.pricingRequestId.slice(0, 8)}
                            </p>
                          </div>
                        </PortalTableCell>
                        <PortalTableCell className="px-5 text-sm font-semibold text-surface-600 dark:text-surface-300">
                          {split.clientName || split.clientEmail || t('profitSplits.unknownClient')}
                        </PortalTableCell>
                        <PortalTableCell className="px-5 text-sm font-black">
                          {formatCurrency(split.grossRevenue, split.currency)}
                        </PortalTableCell>
                        <PortalTableCell className="px-5 text-sm font-black text-rose-600">
                          {formatCurrency(split.totalExpenses, split.currency)}
                        </PortalTableCell>
                        <PortalTableCell className="px-5 text-sm font-black text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(split.netProfit, split.currency)}
                        </PortalTableCell>
                        <PortalTableCell className="px-5">
                          <div
                            className={cn(
                              'inline-flex rounded-full px-3 py-1 text-xs font-black',
                              tone === 'success' &&
                                'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
                              tone === 'warning' &&
                                'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
                              tone === 'danger' &&
                                'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                            )}
                          >
                            {split.totalAllocatedPercentage}% ·{' '}
                            {formatCurrency(split.unallocatedAmount, split.currency)}
                          </div>
                        </PortalTableCell>
                        <PortalTableCell className="px-5">
                          <Badge
                            variant={
                              split.status === PROFIT_SPLIT_STATUS.FINALIZED ? 'green' : 'yellow'
                            }
                          >
                            {t(`profitSplits.status.${split.status}`)}
                          </Badge>
                        </PortalTableCell>
                        <PortalTableCell className="px-5 text-sm font-semibold text-surface-500">
                          {dateLabel(split.updatedAt, locale)}
                        </PortalTableCell>
                        <PortalTableCell cellAlign="end" className="px-5">
                          <div className="flex justify-end gap-2">
                            <IconButton
                              icon={Pencil}
                              label={
                                split.status === PROFIT_SPLIT_STATUS.FINALIZED
                                  ? t('common.view')
                                  : t('common.edit')
                              }
                              variant="ghost"
                              size="sm"
                              iconSize={16}
                              className="min-h-[44px] min-w-[44px]"
                              onClick={() => {
                                setSelectedSplit(split);
                                setEditorOpen(true);
                              }}
                            />
                          </div>
                        </PortalTableCell>
                      </PortalTableRow>
                    );
                  })}
                </PortalTableBody>
              </PortalTableElement>
            </PortalTableScroll>
          </PortalTable>
        )}
      </Card>

      <Card noPadding className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-surface-100 bg-surface-50/60 p-4 dark:border-surface-800 dark:bg-surface-900/40 md:flex-row md:items-center">
          <div>
            <h3 className="text-base font-black text-surface-900 dark:text-white">
              {t('profitSplits.employeeSummary')}
            </h3>
            <p className="text-sm text-surface-500">{t('profitSplits.employeeSummaryHint')}</p>
          </div>
          <Select
            value={employeeStatusFilter}
            onChange={event =>
              setEmployeeStatusFilter(event.target.value as 'all' | 'draft' | 'finalized')
            }
            className="w-[180px]"
            options={[
              { value: 'all', label: t('common.all') },
              { value: PROFIT_SPLIT_STATUS.FINALIZED, label: t('profitSplits.status.finalized') },
              { value: PROFIT_SPLIT_STATUS.DRAFT, label: t('profitSplits.status.draft') },
            ]}
          />
        </div>

        {employeeSummary.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm font-medium text-surface-500">
            {t('profitSplits.noEmployeeSummary')}
          </div>
        ) : (
          <PortalTable className="border-0 shadow-none bg-transparent rounded-none overflow-visible">
            <PortalTableScroll>
              <PortalTableElement className="min-w-[900px]">
                <PortalTableHeader className="bg-surface-50/50 dark:bg-surface-900/50">
                  <PortalTableRow className="cursor-default">
                    {[
                      t('profitSplits.employee'),
                      t('profitSplits.totalEarned'),
                      t('profitSplits.roles.lead'),
                      t('profitSplits.roles.sales'),
                      t('profitSplits.roles.management'),
                      t('profitSplits.roles.delivery'),
                      t('profitSplits.projectsCount'),
                    ].map(label => (
                      <PortalTableHead key={label} headStyle="default" className="px-5">
                        {label}
                      </PortalTableHead>
                    ))}
                  </PortalTableRow>
                </PortalTableHeader>
                <PortalTableBody>
                  {employeeSummary.map(employee => (
                    <PortalTableRow key={`${employee.userId}:${employee.currency}`} hover>
                      <PortalTableCell className="px-5 font-bold text-surface-900 dark:text-white">
                        {employee.userName}
                      </PortalTableCell>
                      <PortalTableCell className="px-5 font-black text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(employee.totalAmount, employee.currency)}
                      </PortalTableCell>
                      <PortalTableCell className="px-5 font-semibold">
                        {formatCurrency(employee.leadAmount, employee.currency)}
                      </PortalTableCell>
                      <PortalTableCell className="px-5 font-semibold">
                        {formatCurrency(employee.salesAmount, employee.currency)}
                      </PortalTableCell>
                      <PortalTableCell className="px-5 font-semibold">
                        {formatCurrency(employee.managementAmount, employee.currency)}
                      </PortalTableCell>
                      <PortalTableCell className="px-5 font-semibold">
                        {formatCurrency(employee.deliveryAmount, employee.currency)}
                      </PortalTableCell>
                      <PortalTableCell className="px-5 font-semibold">
                        {employee.projectCount}
                      </PortalTableCell>
                    </PortalTableRow>
                  ))}
                </PortalTableBody>
              </PortalTableElement>
            </PortalTableScroll>
          </PortalTable>
        )}
      </Card>

      {editorOpen && selectedSplit && (
        <ProfitSplitEditor
          split={selectedSplit}
          onClose={() => {
            setEditorOpen(false);
            setSelectedSplit(null);
          }}
        />
      )}
    </div>
  );
}
