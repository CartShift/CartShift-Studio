'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertTriangle,
  CheckCircle2,
  HandCoins,
  Loader2,
  Pencil,
  PieChart,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ModalBackdrop } from '@/components/ui/ModalBackdrop';
import { Select } from '@/components/ui/Select';
import {
  useCanManageProfitSplits,
  usePaidPricingRequestsForProfitSplits,
  useProfitSplitAgencyTeam,
  useProfitSplitMutations,
  useProfitSplits,
} from '@/lib/hooks/useProfitSplits';
import { calculateProfitSplit } from '@/lib/services/profit-splits';
import { formatCurrency } from '@/lib/types/pricing';
import {
  PROFIT_SPLIT_ROLE,
  PROFIT_SPLIT_STATUS,
  ProfitSplit,
  ProfitSplitEmployeeSummary,
  ProfitSplitExpense,
  ProfitSplitParticipant,
  ProfitSplitRole,
  UpdateProfitSplitData,
} from '@/lib/types/profit-split';
import { Currency, PricingRequest } from '@/lib/types/pricing';
import { PortalUser } from '@/lib/types/portal';
import { cn } from '@/lib/utils';

const roleOrder: ProfitSplitRole[] = [
  PROFIT_SPLIT_ROLE.LEAD,
  PROFIT_SPLIT_ROLE.SALES,
  PROFIT_SPLIT_ROLE.MANAGEMENT,
  PROFIT_SPLIT_ROLE.DELIVERY,
];

function generateLocalId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function centsFromInput(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

function dateLabel(timestamp: ProfitSplit['updatedAt'] | undefined, locale: string): string {
  if (!timestamp?.toDate) return '';
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(timestamp.toDate());
}

function getEditableParticipants(split: ProfitSplit): Omit<ProfitSplitParticipant, 'amount'>[] {
  return split.participants.map(({ amount: _amount, ...participant }) => participant);
}

function buildEmployeeSummary(splits: ProfitSplit[]): ProfitSplitEmployeeSummary[] {
  const summaries = new Map<string, ProfitSplitEmployeeSummary & { projects: Set<string> }>();

  for (const split of splits) {
    for (const participant of split.participants) {
      if (!participant.userId) continue;
      const summaryKey = `${participant.userId}:${split.currency}`;
      const existing =
        summaries.get(summaryKey) ??
        ({
          userId: participant.userId,
          userName: participant.userName,
          currency: split.currency,
          totalAmount: 0,
          leadAmount: 0,
          salesAmount: 0,
          managementAmount: 0,
          deliveryAmount: 0,
          projectCount: 0,
          projects: new Set<string>(),
        } satisfies ProfitSplitEmployeeSummary & { projects: Set<string> });

      existing.userName = participant.userName || existing.userName;
      existing.totalAmount += participant.amount;
      existing.projects.add(split.id);

      if (participant.role === PROFIT_SPLIT_ROLE.LEAD) existing.leadAmount += participant.amount;
      if (participant.role === PROFIT_SPLIT_ROLE.SALES) existing.salesAmount += participant.amount;
      if (participant.role === PROFIT_SPLIT_ROLE.MANAGEMENT) {
        existing.managementAmount += participant.amount;
      }
      if (participant.role === PROFIT_SPLIT_ROLE.DELIVERY) {
        existing.deliveryAmount += participant.amount;
      }

      summaries.set(summaryKey, existing);
    }
  }

  return Array.from(summaries.values())
    .map(({ projects, ...summary }) => ({ ...summary, projectCount: projects.size }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

function formatCurrencyBreakdown(
  totals: Partial<Record<Currency, number>>,
  fallbackCurrency: Currency
): string {
  const entries = Object.entries(totals) as [Currency, number][];
  if (entries.length === 0) return formatCurrency(0, fallbackCurrency);
  return entries.map(([currency, total]) => formatCurrency(total, currency)).join(' · ');
}

function summarizeByCurrency(
  splits: ProfitSplit[],
  getAmount: (split: ProfitSplit) => number
): Partial<Record<Currency, number>> {
  return splits.reduce<Partial<Record<Currency, number>>>((totals, split) => {
    totals[split.currency] = (totals[split.currency] ?? 0) + getAmount(split);
    return totals;
  }, {});
}

function allocationTone(split: ProfitSplit) {
  if (split.netProfit < 0) return 'danger';
  if (split.totalAllocatedPercentage === 100) return 'success';
  if (split.totalAllocatedPercentage > 100) return 'danger';
  return 'warning';
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple';
}

function MetricCard({ label, value, icon, tone }: MetricCardProps) {
  const toneClass = {
    emerald:
      'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 text-emerald-700 dark:text-emerald-300',
    blue: 'from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 text-primary-700 dark:text-primary-300',
    amber:
      'from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 text-amber-700 dark:text-amber-300',
    rose: 'from-rose-50 to-rose-100/50 dark:from-rose-900/20 dark:to-rose-800/10 text-rose-700 dark:text-rose-300',
    purple:
      'from-accent-50 to-accent-100/50 dark:from-accent-900/20 dark:to-accent-800/10 text-accent-700 dark:text-accent-300',
  }[tone];

  return (
    <Card
      className={cn('p-4 bg-surface-50 dark:bg-surface-900/50 border-surface-200/70 dark:border-white/10', toneClass)}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/70 dark:bg-white/10 flex items-center justify-center">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
          <p className="text-xl font-black truncate">{value}</p>
        </div>
      </div>
    </Card>
  );
}

interface ProfitSplitEditorProps {
  split: ProfitSplit | null;
  paidRequests: PricingRequest[];
  existingSplits: ProfitSplit[];
  agencyTeam: PortalUser[];
  onClose: () => void;
  onCreated: (split: ProfitSplit) => void;
}

function ProfitSplitEditor({
  split,
  paidRequests,
  existingSplits,
  agencyTeam,
  onClose,
  onCreated,
}: ProfitSplitEditorProps) {
  const t = useTranslations('portal');
  const { createFromPricingRequest, saveDraft, finalize, remove, isMutating } =
    useProfitSplitMutations();
  const [selectedPricingRequestId, setSelectedPricingRequestId] = useState('');
  const [projectTitle, setProjectTitle] = useState(split?.projectTitle ?? '');
  const [clientName, setClientName] = useState(split?.clientName ?? '');
  const [grossRevenue, setGrossRevenue] = useState(split?.grossRevenue ?? 0);
  const [directExpenses, setDirectExpenses] = useState<ProfitSplitExpense[]>(
    split?.directExpenses ?? []
  );
  const [participants, setParticipants] = useState<Omit<ProfitSplitParticipant, 'amount'>[]>(
    split ? getEditableParticipants(split) : []
  );

  useEffect(() => {
    if (!split) return;
    setProjectTitle(split.projectTitle);
    setClientName(split.clientName ?? '');
    setGrossRevenue(split.grossRevenue);
    setDirectExpenses(split.directExpenses);
    setParticipants(getEditableParticipants(split));
  }, [split]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const calculation = useMemo(
    () =>
      split
        ? calculateProfitSplit({
            grossRevenue,
            directExpenses,
            participants,
          })
        : null,
    [directExpenses, grossRevenue, participants, split]
  );

  const selectedPricingRequest = paidRequests.find(
    request => request.id === selectedPricingRequestId
  );
  const availablePaidRequests = paidRequests.filter(
    request =>
      !existingSplits.some(existing => existing.pricingRequestId === request.id) ||
      request.id === split?.pricingRequestId
  );

  const canFinalize =
    !!split &&
    split.status === PROFIT_SPLIT_STATUS.DRAFT &&
    !!calculation &&
    calculation.totalAllocatedPercentage === 100 &&
    calculation.netProfit >= 0 &&
    !!projectTitle.trim() &&
    calculation.participants.every(participant => participant.userId && participant.userName);

  const handleCreate = async () => {
    if (!selectedPricingRequestId) return;
    try {
      const created = await createFromPricingRequest.mutateAsync(selectedPricingRequestId);
      onCreated(created);
    } catch {
      // Mutation feedback is handled by Sonner in the hook.
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (!split || !calculation) return false;
    const data: UpdateProfitSplitData = {
      projectTitle,
      clientName,
      grossRevenue,
      directExpenses,
      participants,
    };
    try {
      await saveDraft.mutateAsync({ id: split.id, data });
      return true;
    } catch {
      // Mutation feedback is handled by Sonner in the hook.
      return false;
    }
  };

  const addExpense = () => {
    setDirectExpenses(prev => [
      ...prev,
      { id: generateLocalId('expense'), description: '', amount: 0 },
    ]);
  };

  const addParticipant = () => {
    setParticipants(prev => [
      ...prev,
      {
        id: generateLocalId('participant'),
        userId: '',
        userName: '',
        role: PROFIT_SPLIT_ROLE.DELIVERY,
        percentage: 0,
      },
    ]);
  };

  return (
    <ModalBackdrop isOpen onClick={onClose} variant="surface" zIndex={80}>
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-3 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profit-split-editor-title"
          className="pointer-events-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl dark:border-surface-800 dark:bg-surface-950 sm:max-h-[calc(100dvh-2rem)]"
        >
          <div className="flex items-start justify-between gap-3 border-b border-surface-200 p-3.5 dark:border-surface-800 sm:p-4">
            <div>
              <h2
                id="profit-split-editor-title"
                className="text-xl font-black text-surface-900 dark:text-white"
              >
                {split ? t('profitSplits.editorTitle') : t('profitSplits.createTitle')}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-surface-500 dark:text-surface-400">
                {t('profitSplits.editorSubtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 dark:hover:bg-surface-800"
              aria-label={t('common.close')}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4">
            {!split ? (
              <div className="mx-auto max-w-xl space-y-4">
                <Card className="p-4">
                  <Select
                    label={t('profitSplits.selectPaidRequest')}
                    value={selectedPricingRequestId}
                    onChange={event => setSelectedPricingRequestId(event.target.value)}
                  >
                    <option value="">{t('profitSplits.selectPaidRequestPlaceholder')}</option>
                    {availablePaidRequests.map(request => (
                      <option key={request.id} value={request.id}>
                        {request.title} · {formatCurrency(request.totalAmount, request.currency)}
                      </option>
                    ))}
                  </Select>

                  {selectedPricingRequest && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-[13px] text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                      <p className="font-bold">{selectedPricingRequest.title}</p>
                      <p className="mt-1">
                        {selectedPricingRequest.clientName ||
                          selectedPricingRequest.clientEmail ||
                          'Client'}{' '}
                        ·{' '}
                        {formatCurrency(
                          selectedPricingRequest.totalAmount,
                          selectedPricingRequest.currency
                        )}
                      </p>
                    </div>
                  )}

                  {availablePaidRequests.length === 0 && (
                    <p className="mt-4 text-sm font-medium text-surface-500">
                      {t('profitSplits.noPaidRequests')}
                    </p>
                  )}
                </Card>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="space-y-4">
                  <Card className="p-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="space-y-1.5 md:col-span-2">
                        <span className="text-sm font-bold text-surface-700 dark:text-surface-300">
                          {t('profitSplits.projectTitle')}
                        </span>
                        <input
                          value={projectTitle}
                          onChange={event => setProjectTitle(event.target.value)}
                          className="portal-input h-10 w-full"
                          disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-bold text-surface-700 dark:text-surface-300">
                          {t('profitSplits.client')}
                        </span>
                        <input
                          value={clientName}
                          onChange={event => setClientName(event.target.value)}
                          className="portal-input h-10 w-full"
                          disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-bold text-surface-700 dark:text-surface-300">
                          {t('profitSplits.grossRevenue')}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={(grossRevenue / 100).toString()}
                          onChange={event => setGrossRevenue(centsFromInput(event.target.value))}
                          className="portal-input h-10 w-full"
                          disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                        />
                      </label>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-surface-900 dark:text-white">
                          {t('profitSplits.expenses')}
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          {t('profitSplits.expensesHint')}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addExpense}
                        disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                      >
                        <Plus size={16} />
                        {t('profitSplits.addExpense')}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {directExpenses.map(expense => (
                        <div key={expense.id} className="grid gap-3 md:grid-cols-[1fr_160px_44px]">
                          <input
                            value={expense.description}
                            onChange={event =>
                              setDirectExpenses(prev =>
                                prev.map(item =>
                                  item.id === expense.id
                                    ? { ...item, description: event.target.value }
                                    : item
                                )
                              )
                            }
                            placeholder={t('profitSplits.expenseDescription')}
                            className="portal-input h-10 w-full"
                            disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={(expense.amount / 100).toString()}
                            onChange={event =>
                              setDirectExpenses(prev =>
                                prev.map(item =>
                                  item.id === expense.id
                                    ? { ...item, amount: centsFromInput(event.target.value) }
                                    : item
                                )
                              )
                            }
                            className="portal-input h-10 w-full"
                            disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setDirectExpenses(prev => prev.filter(item => item.id !== expense.id))
                            }
                            disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                            aria-label={t('profitSplits.removeExpense')}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                      {directExpenses.length === 0 && (
                        <p className="rounded-2xl bg-surface-50 p-4 text-sm font-medium text-surface-500 dark:bg-surface-900 dark:text-surface-400">
                          {t('profitSplits.noExpenses')}
                        </p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-surface-900 dark:text-white">
                          {t('profitSplits.participants')}
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          {t('profitSplits.participantsHint')}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addParticipant}
                        disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                      >
                        <Plus size={16} />
                        {t('profitSplits.addParticipant')}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {participants.map(participant => {
                        const calculatedParticipant = calculation?.participants.find(
                          item => item.id === participant.id
                        );

                        return (
                          <div
                            key={participant.id}
                            className="grid gap-2.5 rounded-xl border border-surface-200 p-2.5 dark:border-surface-800 xl:grid-cols-[132px_1fr_112px_132px_1fr_40px]"
                          >
                            <Select
                              value={participant.role}
                              onChange={event =>
                                setParticipants(prev =>
                                  prev.map(item =>
                                    item.id === participant.id
                                      ? { ...item, role: event.target.value as ProfitSplitRole }
                                      : item
                                  )
                                )
                              }
                              disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                              options={roleOrder.map(role => ({
                                value: role,
                                label: t(`profitSplits.roles.${role}`),
                              }))}
                            />
                            <Select
                              value={participant.userId}
                              onChange={event => {
                                const user = agencyTeam.find(
                                  member => member.id === event.target.value
                                );
                                setParticipants(prev =>
                                  prev.map(item =>
                                    item.id === participant.id
                                      ? {
                                          ...item,
                                          userId: user?.id ?? '',
                                          userName: user?.name || user?.email || '',
                                        }
                                      : item
                                  )
                                );
                              }}
                              disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                            >
                              <option value="">{t('profitSplits.unassigned')}</option>
                              {agencyTeam.map(member => (
                                <option key={member.id} value={member.id}>
                                  {member.name || member.email}
                                </option>
                              ))}
                            </Select>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={participant.percentage.toString()}
                              onChange={event =>
                                setParticipants(prev =>
                                  prev.map(item =>
                                    item.id === participant.id
                                      ? { ...item, percentage: Number(event.target.value) || 0 }
                                      : item
                                  )
                                )
                              }
                              className="portal-input h-10 w-full"
                              aria-label={t('profitSplits.percentage')}
                              disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                            />
                            <div className="flex h-10 items-center rounded-lg bg-surface-50 px-3 text-[13px] font-black text-surface-900 dark:bg-surface-900 dark:text-white">
                              {calculatedParticipant
                                ? formatCurrency(calculatedParticipant.amount, split.currency)
                                : formatCurrency(0, split.currency)}
                            </div>
                            <input
                              value={participant.notes ?? ''}
                              onChange={event =>
                                setParticipants(prev =>
                                  prev.map(item =>
                                    item.id === participant.id
                                      ? { ...item, notes: event.target.value }
                                      : item
                                  )
                                )
                              }
                              placeholder={t('profitSplits.notes')}
                              className="portal-input h-10 w-full"
                              disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setParticipants(prev =>
                                  prev.filter(item => item.id !== participant.id)
                                )
                              }
                              disabled={split.status === PROFIT_SPLIT_STATUS.FINALIZED}
                              aria-label={t('profitSplits.removeParticipant')}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>

                {calculation && (
                  <aside className="space-y-3">
                    <Card
                      className="p-4"
                      accent={
                        allocationTone({ ...split, ...calculation }) === 'success'
                          ? 'success'
                          : 'warning'
                      }
                    >
                      <h3 className="text-base font-black text-surface-900 dark:text-white">
                        {t('profitSplits.liveCalculation')}
                      </h3>
                      <div className="mt-3 space-y-2.5 text-[13px]">
                        <div className="flex justify-between gap-3">
                          <span className="text-surface-500">{t('profitSplits.grossRevenue')}</span>
                          <span className="font-black text-surface-900 dark:text-white">
                            {formatCurrency(grossRevenue, split.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-surface-500">
                            {t('profitSplits.totalExpenses')}
                          </span>
                          <span className="font-black text-rose-600">
                            {formatCurrency(calculation.totalExpenses, split.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3 border-t border-surface-200 pt-2.5 dark:border-surface-800">
                          <span className="text-surface-500">{t('profitSplits.netProfit')}</span>
                          <span
                            className={cn(
                              'font-black',
                              calculation.netProfit < 0
                                ? 'text-rose-600'
                                : 'text-emerald-700 dark:text-emerald-300'
                            )}
                          >
                            {formatCurrency(calculation.netProfit, split.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-surface-500">
                            {t('profitSplits.totalAllocated')}
                          </span>
                          <span className="font-black text-surface-900 dark:text-white">
                            {calculation.totalAllocatedPercentage}% ·{' '}
                            {formatCurrency(calculation.totalAllocatedAmount, split.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-surface-500">{t('profitSplits.unallocated')}</span>
                          <span className="font-black text-surface-900 dark:text-white">
                            {calculation.unallocatedPercentage}% ·{' '}
                            {formatCurrency(calculation.unallocatedAmount, split.currency)}
                          </span>
                        </div>
                      </div>

                      {calculation.netProfit < 0 && (
                        <div className="mt-3 rounded-xl bg-rose-50 p-2.5 text-[13px] font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                          {t('profitSplits.negativeProfitWarning')}
                        </div>
                      )}
                      {calculation.totalAllocatedPercentage !== 100 && (
                        <div className="mt-3 rounded-xl bg-amber-50 p-2.5 text-[13px] font-bold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                          {t('profitSplits.allocationWarning')}
                        </div>
                      )}
                    </Card>
                  </aside>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-surface-200 p-3.5 dark:border-surface-800 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="text-[13px] font-medium text-surface-500">
              {split?.status === PROFIT_SPLIT_STATUS.FINALIZED
                ? t('profitSplits.finalizedLocked')
                : t('profitSplits.draftHint')}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {split && split.status === PROFIT_SPLIT_STATUS.DRAFT && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={async () => {
                    if (!window.confirm(t('common.confirm'))) return;
                    try {
                      await remove.mutateAsync(split.id);
                      onClose();
                    } catch {
                      // Mutation feedback is handled by Sonner in the hook.
                    }
                  }}
                  disabled={isMutating}
                >
                  <Trash2 size={16} />
                  {t('common.delete')}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              {!split ? (
                <Button
                  type="button"
                  onClick={handleCreate}
                  loading={createFromPricingRequest.isPending}
                  disabled={!selectedPricingRequestId || isMutating}
                >
                  <Plus size={16} />
                  {t('profitSplits.create')}
                </Button>
              ) : (
                <>
                  {split.status === PROFIT_SPLIT_STATUS.DRAFT && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSave}
                      loading={saveDraft.isPending}
                      disabled={isMutating}
                    >
                      <Save size={16} />
                      {t('profitSplits.saveDraft')}
                    </Button>
                  )}
                  {split.status === PROFIT_SPLIT_STATUS.DRAFT && (
                    <Button
                      type="button"
                      variant="success"
                      onClick={async () => {
                        if (!(await handleSave())) return;
                        try {
                          await finalize.mutateAsync(split.id);
                          onClose();
                        } catch {
                          // Mutation feedback is handled by Sonner in the hook.
                        }
                      }}
                      loading={finalize.isPending}
                      disabled={!canFinalize || isMutating}
                    >
                      <CheckCircle2 size={16} />
                      {t('profitSplits.finalize')}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}

export default function ProfitSplitsClient() {
  const t = useTranslations('portal');
  const locale = useLocale();
  const { loading: accessLoading, canManage } = useCanManageProfitSplits();
  const { splits, loading, error, refetch } = useProfitSplits();
  const { paidRequests, error: paidRequestsError } = usePaidPricingRequestsForProfitSplits();
  const { agencyTeam, error: agencyTeamError } = useProfitSplitAgencyTeam();
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

  if (accessLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="text-xs font-bold uppercase tracking-widest text-surface-500">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-10 text-center">
        <ShieldCheck className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h2 className="mb-2 text-2xl font-bold text-surface-900 dark:text-white">
          {t('agency.accessDeniedTitle')}
        </h2>
        <p className="mx-auto max-w-sm text-surface-500">{t('profitSplits.accessDenied')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 dark:bg-emerald-500 shadow-lg shadow-emerald-500/25">
              <PieChart className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
              {t('profitSplits.title')}
            </h1>
          </div>
          <p className="ms-[52px] text-surface-500 dark:text-surface-400">
            {t('profitSplits.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            {t('common.refresh')}
          </Button>
          <Button
            onClick={() => {
              setSelectedSplit(null);
              setEditorOpen(true);
            }}
          >
            <Plus size={18} />
            {t('profitSplits.create')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label={t('profitSplits.totalNetProfit')}
          value={formatCurrencyBreakdown(summary.totalNetProfit, primaryCurrency)}
          icon={<WalletCards className="h-5 w-5" />}
          tone="emerald"
        />
        <MetricCard
          label={t('profitSplits.totalAllocated')}
          value={formatCurrencyBreakdown(summary.totalAllocated, primaryCurrency)}
          icon={<HandCoins className="h-5 w-5" />}
          tone="blue"
        />
        <MetricCard
          label={t('profitSplits.unallocated')}
          value={formatCurrencyBreakdown(summary.unallocated, primaryCurrency)}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone={
            Object.values(summary.unallocated).every(amount => amount === 0) ? 'purple' : 'amber'
          }
        />
        <MetricCard
          label={t('profitSplits.finalizedSplits')}
          value={summary.finalized.toString()}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="purple"
        />
        <MetricCard
          label={t('profitSplits.draftSplits')}
          value={summary.drafts.toString()}
          icon={<Pencil className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="border-b border-surface-100 bg-surface-50/60 p-5 dark:border-surface-800 dark:bg-surface-900/40">
          <h2 className="text-lg font-black text-surface-900 dark:text-white">
            {t('profitSplits.projects')}
          </h2>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-start">
              <thead>
                <tr className="bg-surface-50/50 dark:bg-surface-900/50">
                  {[
                    t('profitSplits.projectTitle'),
                    t('profitSplits.client'),
                    t('profitSplits.grossRevenue'),
                    t('profitSplits.expenses'),
                    t('profitSplits.netProfit'),
                    t('profitSplits.allocationStatus'),
                    t('common.status'),
                    t('profitSplits.updated'),
                    t('common.actions'),
                  ].map(label => (
                    <th
                      key={label}
                      className="px-5 py-4 text-start text-[11px] font-black uppercase tracking-widest text-surface-400"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {splits.map(split => {
                  const tone = allocationTone(split);

                  return (
                    <tr
                      key={split.id}
                      className="transition-colors hover:bg-surface-50/60 dark:hover:bg-surface-800/30"
                    >
                      <td className="px-5 py-4">
                        <div className="max-w-xs">
                          <p className="truncate font-bold text-surface-900 dark:text-white">
                            {split.projectTitle}
                          </p>
                          <p className="mt-1 text-xs font-mono text-surface-400">
                            {split.pricingRequestId.slice(0, 8)}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300">
                        {split.clientName || split.clientEmail || t('profitSplits.unknownClient')}
                      </td>
                      <td className="px-5 py-4 text-sm font-black">
                        {formatCurrency(split.grossRevenue, split.currency)}
                      </td>
                      <td className="px-5 py-4 text-sm font-black text-rose-600">
                        {formatCurrency(split.totalExpenses, split.currency)}
                      </td>
                      <td className="px-5 py-4 text-sm font-black text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(split.netProfit, split.currency)}
                      </td>
                      <td className="px-5 py-4">
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
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            split.status === PROFIT_SPLIT_STATUS.FINALIZED ? 'green' : 'yellow'
                          }
                        >
                          {t(`profitSplits.status.${split.status}`)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-surface-500">
                        {dateLabel(split.updatedAt, locale)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSplit(split);
                              setEditorOpen(true);
                            }}
                          >
                            <Pencil size={16} />
                            {split.status === PROFIT_SPLIT_STATUS.FINALIZED
                              ? t('common.view')
                              : t('common.edit')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card noPadding className="overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-surface-100 bg-surface-50/60 p-5 dark:border-surface-800 dark:bg-surface-900/40 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-black text-surface-900 dark:text-white">
              {t('profitSplits.employeeSummary')}
            </h2>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-start">
              <thead>
                <tr className="bg-surface-50/50 dark:bg-surface-900/50">
                  {[
                    t('profitSplits.employee'),
                    t('profitSplits.totalEarned'),
                    t('profitSplits.roles.lead'),
                    t('profitSplits.roles.sales'),
                    t('profitSplits.roles.management'),
                    t('profitSplits.roles.delivery'),
                    t('profitSplits.projectsCount'),
                  ].map(label => (
                    <th
                      key={label}
                      className="px-5 py-4 text-start text-[11px] font-black uppercase tracking-widest text-surface-400"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {employeeSummary.map(employee => (
                  <tr key={`${employee.userId}:${employee.currency}`}>
                    <td className="px-5 py-4 font-bold text-surface-900 dark:text-white">
                      {employee.userName}
                    </td>
                    <td className="px-5 py-4 font-black text-emerald-700 dark:text-emerald-300">
                      {formatCurrency(employee.totalAmount, employee.currency)}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {formatCurrency(employee.leadAmount, employee.currency)}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {formatCurrency(employee.salesAmount, employee.currency)}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {formatCurrency(employee.managementAmount, employee.currency)}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {formatCurrency(employee.deliveryAmount, employee.currency)}
                    </td>
                    <td className="px-5 py-4 font-semibold">{employee.projectCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editorOpen && (
        <ProfitSplitEditor
          split={selectedSplit}
          paidRequests={paidRequests}
          existingSplits={splits}
          agencyTeam={agencyTeam}
          onClose={() => {
            setEditorOpen(false);
            setSelectedSplit(null);
          }}
          onCreated={split => setSelectedSplit(split)}
        />
      )}
    </div>
  );
}
