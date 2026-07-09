'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Plus,
  Users,
  ArrowUpRight,
  MoreVertical,
  Briefcase,
  TrendingUp,
  Loader2,
  ShieldCheck,
  DollarSign,
  Clock,
  Eye,
  Trash2,
} from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useQueryClient } from '@tanstack/react-query';
import { invalidatePortalRequestData } from '@/lib/utils/portal-cache-invalidation';
import { queryKeys } from '@/lib/utils/query-keys';
import { useAgencyClientMutations } from '@/lib/hooks/useAgencyClientMutations';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getPortalPath } from '@/lib/utils/portal-paths';
import {
  getAgencyClientBadgeKey,
  getAgencyClientPlanKey,
} from '@/lib/i18n/portal-translation-keys';
import { Dropdown } from '@/components/ui/Dropdown';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useAgencyClients } from '@/lib/hooks/useAgencyClients';
import { useImpersonation } from '@/lib/context/ImpersonationContext';
import { CURRENCY_CONFIG, Currency } from '@/lib/types/portal';
import {
  ClientMultiFilter,
  type ClientStatus,
  type ClientPlan,
} from '@/components/portal/clients/ClientMultiFilter';
import { ClientList } from '@/components/portal/clients/ClientList';
import { PortalMetricCard } from '@/components/portal/ui/PortalMetricCard';
import { PortalPageHeader } from '@/components/portal/ui/PortalPageHeader';
import { PortalSearchField } from '@/components/portal/ui/PortalSearchField';

// Format currency with abbreviations for large numbers
function formatRevenue(amountInCents: number, currency: Currency = 'USD'): string {
  const config = CURRENCY_CONFIG[currency];
  const amount = amountInCents / 100;

  if (amount >= 1000000) {
    return `${config.symbol}${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${config.symbol}${(amount / 1000).toFixed(1)}K`;
  }
  return `${config.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function AgencyClientsClient() {
  const t = useTranslations('portal');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { loading: auth, isAuthenticated, user } = usePortalAuth();
  const { organizations, loading: clients, userData } = useAgencyClients();
  const { viewAsClient } = useImpersonation();

  const { deleteClient, repairAccount } = useAgencyClientMutations();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyClientsOnly, setShowMyClientsOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ClientStatus[]>([]);
  const [planFilter, setPlanFilter] = useState<ClientPlan[]>([]);
  const [revenueRange, setRevenueRange] = useState({ min: 0, max: 10000000 });
  const [isRepairing, setIsRepairing] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Sync loading state or use derived state
    if (!auth && !clients) {
      setLoading(false);
    }
  }, [auth, clients]);

  // Calculate totals for the header stats
  const totals = useMemo(() => {
    const totalRevenue = organizations.reduce((sum, org) => sum + (org.totalRevenue || 0), 0);
    const pendingRevenue = organizations.reduce((sum, org) => sum + (org.pendingRevenue || 0), 0);
    return { totalRevenue, pendingRevenue };
  }, [organizations]);

  const handleRepair = async () => {
    if (!user) return;
    setIsRepairing(true);
    try {
      await repairAccount({
        userId: user.uid,
        email: user.email ?? null,
        nameFallback: t('common.agencyAdmin'),
      });
      window.location.reload();
    } catch (err) {
      console.error('Repair failed:', err);
      toast.error(t('agency.repairFailed'));
    } finally {
      setIsRepairing(false);
    }
  };

  const filteredOrgs = useMemo(() => {
    return organizations.filter(org => {
      // Search filter
      const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // My Clients filter
      if (showMyClientsOnly && org.responsibleAgencyUserId !== user?.uid) {
        return false;
      }

      const orgStatus = org.status || 'active';

      // Status filter — default view hides deactivated clients unless explicitly filtered
      if (statusFilter.length > 0) {
        if (!statusFilter.includes(orgStatus as ClientStatus)) {
          return false;
        }
      } else if (orgStatus === 'inactive') {
        return false;
      }

      // Plan filter
      if (planFilter.length > 0) {
        const orgPlan = org.plan || 'free';
        if (!planFilter.includes(orgPlan as ClientPlan)) {
          return false;
        }
      }

      // Revenue range filter (revenue is stored in cents, convert to dollars for comparison)
      const revenueInDollars = (org.totalRevenue || 0) / 100;
      if (revenueRange.min > 0 && revenueInDollars < revenueRange.min) {
        return false;
      }
      if (revenueRange.max < 10000000 && revenueInDollars > revenueRange.max) {
        return false;
      }

      return true;
    });
  }, [
    organizations,
    searchQuery,
    showMyClientsOnly,
    statusFilter,
    planFilter,
    revenueRange,
    user?.uid,
  ]);

  const handleDeleteClient = async () => {
    if (!orgToDelete) return;
    setIsDeleting(true);
    const deletedOrgId = orgToDelete.id;
    const deletedOrgName = orgToDelete.name;
    try {
      await deleteClient(deletedOrgId);
      queryClient.setQueryData(
        queryKeys.agencyClients,
        (currentOrgs: typeof organizations | undefined) =>
          currentOrgs?.map(org =>
            org.id === deletedOrgId ? { ...org, status: 'inactive' as const } : org
          )
      );
      setOrgToDelete(null);
      invalidatePortalRequestData(queryClient, { orgId: deletedOrgId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.agencyClients }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sales.clientRevenue }),
        queryClient.invalidateQueries({ queryKey: queryKeys.sales.metrics }),
      ]);
      toast.success(
        t('agency.clients.deleteSuccess', { name: deletedOrgName }) ??
          `${deletedOrgName} was deactivated`
      );
    } catch (err) {
      console.error('Failed to delete client:', err);
      toast.error(t('agency.clients.deleteFailed') ?? 'Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  if (auth || (loading && userData?.isAgency)) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-surface-500 font-bold uppercase tracking-widest text-xs">
          {t('agency.clients.loading')}
        </p>
      </div>
    );
  }

  if (!auth && isAuthenticated && !userData?.isAgency) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-10 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          {t('agency.accessDeniedTitle')}
        </h2>
        <p className="text-surface-500 max-w-sm mx-auto mb-8">
          {t('agency.notRegisteredAsAdmin', { email: user?.email || '' })}
        </p>
        <Button
          onClick={handleRepair}
          disabled={isRepairing}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          {isRepairing ? <Loader2 className="animate-spin me-2" size={16} /> : null}
          Repair Permissions & Reload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-700">
      <ConfirmationModal
        isOpen={!!orgToDelete}
        onClose={() => setOrgToDelete(null)}
        onConfirm={handleDeleteClient}
        title={t('agency.clients.deleteTitle') || 'Delete Client'}
        description={
          (t('agency.clients.deleteConfirm', { name: orgToDelete?.name || '' }) as string) ||
          `Are you sure you want to delete ${orgToDelete?.name}? This will deactivate their workspace.`
        }
        confirmText={t('common.delete') || 'Delete'}
        variant="danger"
        isLoading={isDeleting}
      />
      <PortalPageHeader
        title={t('agency.clients.title')}
        description={t('agency.clients.subtitle')}
        className="mb-0"
        action={
          <Link href={getPortalPath('/agency/clients/new/')}>
            <Button leftIcon={<Plus size={18} />}>{t('agency.clients.onboard')}</Button>
          </Link>
        }
      />

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 min-[920px]:grid-cols-4 gap-3.5">
        <Link href={getPortalPath('/agency/sales')} className="rounded-2xl">
          <PortalMetricCard
            icon={DollarSign}
            label={t('sales.metrics.totalRevenue')}
            value={formatRevenue(totals.totalRevenue)}
            tone="success"
            interactive
          />
        </Link>

        <Link href={getPortalPath('/agency/sales')} className="rounded-2xl">
          <PortalMetricCard
            icon={Clock}
            label={t('sales.metrics.pendingRevenue')}
            value={formatRevenue(totals.pendingRevenue)}
            tone="warning"
            interactive
          />
        </Link>

        <PortalMetricCard
          icon={Users}
          label={t('sales.metrics.activeClients')}
          value={filteredOrgs.length}
          tone="neutral"
        />

        <Link href={getPortalPath('/agency/sales')} className="rounded-2xl">
          <PortalMetricCard
            icon={TrendingUp}
            label={t('sales.metrics.avgDealSize')}
            value={
              organizations.filter(o => o.paidCount && o.paidCount > 0).length > 0
                ? formatRevenue(
                    Math.round(
                      totals.totalRevenue /
                        organizations.reduce((sum, o) => sum + (o.paidCount || 0), 0) || 0
                    )
                  )
                : '—'
            }
            tone="primary"
            interactive
          />
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white/70 dark:bg-surface-900/50 p-4 rounded-2xl border border-surface-200/70 dark:border-white/[0.08] shadow-sm backdrop-blur-xl">
        <PortalSearchField
          className="flex-1"
          placeholder={t('agency.clients.searchPlaceholder')}
          value={searchQuery}
          onChange={setSearchQuery}
          inputClassName="h-11 bg-surface-50 dark:bg-surface-900/50"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xs font-medium text-surface-500 dark:text-surface-400 px-2 tabular-nums">
            {filteredOrgs.length} {t('agency.clients.activeAccounts')}
          </div>

          {/* My Clients Toggle */}
          <Button
            variant={showMyClientsOnly ? 'primary' : 'outline'}
            onClick={() => setShowMyClientsOnly(!showMyClientsOnly)}
            size="sm"
            className={cn(
              'h-11 transition-all',
              !showMyClientsOnly && 'border-surface-200 dark:border-surface-800 text-surface-500'
            )}
            aria-label={t('agency.clients.filter.myClients')}
            aria-pressed={showMyClientsOnly}
          >
            <Users size={16} className="me-2" aria-hidden="true" />
            <span className="hidden sm:inline">
              {t('agency.clients.filter.myClients') || 'My Clients'}
            </span>
            <span className="sm:hidden">{t('common.filter')}</span>
          </Button>

          {/* Multi-Filter Dropdown */}
          <ClientMultiFilter
            statusFilter={statusFilter}
            planFilter={planFilter}
            revenueRange={revenueRange}
            onStatusChange={setStatusFilter}
            onPlanChange={setPlanFilter}
            onRevenueRangeChange={setRevenueRange}
            onReset={() => {
              setStatusFilter([]);
              setPlanFilter([]);
              setRevenueRange({ min: 0, max: 10000000 });
            }}
          />

          <Button
            variant="outline"
            size="sm"
            className="h-11 border-surface-200 dark:border-surface-800"
          >
            {t('agency.clients.export')}
          </Button>
        </div>
      </div>

      {filteredOrgs.length > 0 ? (
        <>
          <div className="hidden lg:block">
            <ClientList
              clients={filteredOrgs}
              currentUserId={user?.uid}
              onViewAsClient={viewAsClient}
              onDelete={(id, name) => setOrgToDelete({ id, name })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 min-[1120px]:grid-cols-3 gap-5 lg:hidden">
            {filteredOrgs.map(org => (
            <Card
              key={org.id}
              noPadding
              className="border-surface-200 dark:border-surface-800 shadow-sm transition-all group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl flex items-center justify-center shadow-inner transition-transform duration-300">
                    <Briefcase size={24} className="text-primary-600 opacity-80" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        org.status === 'inactive'
                          ? 'gray'
                          : org.status === 'suspended'
                            ? 'red'
                            : 'green'
                      }
                      className="text-[9px] font-black uppercase tracking-widest h-5"
                    >
                      {org.status
                        ? t(getAgencyClientBadgeKey(org.status))
                        : t('agency.clients.badge.active')}
                    </Badge>
                    {(org.memberCount ?? 0) === 0 && (
                      <Badge
                        variant="yellow"
                        className="text-[9px] font-black uppercase tracking-widest h-5"
                      >
                        {t('agency.clients.badge.pendingInvitation') || 'Pending Invitation'}
                      </Badge>
                    )}
                    {org.responsibleAgencyUserId === user?.uid && (
                      <Badge
                        variant="blue"
                        className="text-[9px] font-black uppercase tracking-widest h-5"
                      >
                        {t('agency.clients.you')}
                      </Badge>
                    )}
                    <div className="text-surface-300 transition-colors">
                      <Dropdown
                        trigger={<MoreVertical size={18} />}
                        align="right"
                        items={[
                          {
                            label: t('agency.clients.detail.overview'),
                            icon: <ArrowUpRight size={16} />,
                            onClick: () => router.push(getPortalPath(`/agency/clients/${org.id}/`)),
                          },
                          {
                            label: t('agency.clients.viewAsClient'),
                            icon: <Eye size={16} />,
                            onClick: () => viewAsClient(org.id),
                          },
                          {
                            label: t('common.delete') || 'Delete',
                            icon: <Trash2 size={16} />,
                            variant: 'danger',
                            onClick: () => setOrgToDelete({ id: org.id, name: org.name }),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2 leading-tight">
                  {org.name}
                </h3>

                <div className="flex items-center gap-2 mb-5">
                  <ShieldCheck
                    size={14}
                    className={cn(
                      org.plan === 'enterprise' ? 'text-purple-500' : 'text-emerald-500'
                    )}
                  />
                  <span className="text-xs font-bold text-surface-500 uppercase tracking-widest">
                    {org.plan
                      ? t(getAgencyClientPlanKey(org.plan))
                      : t('agency.clients.enterprise')}
                  </span>
                </div>

                {/* Revenue Highlight */}
                {(org.totalRevenue ?? 0) > 0 && (
                  <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">
                          {t('sales.metrics.totalRevenue')}
                        </span>
                      </div>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {formatRevenue(org.totalRevenue || 0)}
                      </span>
                    </div>
                    {(org.pendingRevenue ?? 0) > 0 && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-500/20">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                          {t('sales.metrics.pending')}
                        </span>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                          +{formatRevenue(org.pendingRevenue || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-5 border-t border-surface-50 dark:border-surface-800/50">
                  <div>
                    <p className="portal-label-sm text-[10px] mb-1">
                      {t('agency.clients.tickets')}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-surface-900 dark:text-white">
                        {org.requestCount}
                      </span>
                      <TrendingUp size={14} className="text-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <p className="portal-label-sm text-[10px] mb-1">
                      {t('agency.clients.members')}
                    </p>
                    <div
                      className={cn(
                        'flex items-center gap-2 text-lg font-bold',
                        (org.memberCount ?? 0) === 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-surface-900 dark:text-white'
                      )}
                    >
                      <Users
                        size={16}
                        className={
                          (org.memberCount ?? 0) === 0 ? 'text-amber-500' : 'text-surface-400'
                        }
                      />
                      <span>{org.memberCount ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-surface-50/50 dark:bg-surface-900/50 border-t border-surface-50 dark:border-surface-800 rounded-b-2xl transition-colors">
                <Link
                  href={getPortalPath(`/agency/clients/${org.id}/`)}
                  className="flex items-center justify-between text-primary-600 dark:text-primary-400 transition-colors"
                >
                  <span className="text-xs font-black uppercase tracking-widest">
                    {t('agency.clients.detail.overview')}
                  </span>
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="py-20 text-center bg-white dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
            <Users className="w-16 h-16 text-surface-100 dark:text-surface-800 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-surface-900 dark:text-white">
              {t('agency.clients.emptyTitle')}
            </h3>
            <p className="text-surface-500 dark:text-surface-400 text-sm mt-1 max-w-sm mx-auto">
              {t('agency.clients.emptyDesc')}
            </p>
          <Button className="mt-8 h-11 px-8">{t('agency.clients.onboard')}</Button>
        </div>
      )}
    </div>
  );
}
