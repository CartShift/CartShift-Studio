'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Plus,
  Search,
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
  Filter,
  Trash2,
} from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { deleteOrganization } from '@/lib/services/portal-organizations';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Dropdown } from '@/components/ui/Dropdown';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useAgencyClients } from '@/lib/hooks/useAgencyClients';
import { useImpersonation } from '@/lib/context/ImpersonationContext';
import { CURRENCY_CONFIG, Currency } from '@/lib/types/portal';

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
  const { loading: authLoading, isAuthenticated, user } = usePortalAuth();
  const { organizations, loading: clientsLoading, userData } = useAgencyClients();
  const { viewAsClient } = useImpersonation();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyClientsOnly, setShowMyClientsOnly] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Sync loading state or use derived state
    if (!authLoading && !clientsLoading) {
      setLoading(false);
    }
  }, [authLoading, clientsLoading]);

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
      const { getFirestore, doc, updateDoc, setDoc, getDoc } = await import('firebase/firestore');
      const db = getFirestore();
      const userRef = doc(db, 'portal_users', user.uid);
      const snap = await getDoc(userRef);

      const updateData = {
        isAgency: true,
        accountType: 'AGENCY',
        updatedAt: new Date(),
      };

      if (snap.exists()) {
        await updateDoc(userRef, updateData);
      } else {
        await setDoc(userRef, {
          ...updateData,
          email: user.email,
          name: user.displayName || t('common.agencyAdmin' as any),
          createdAt: new Date(),
        });
      }
      window.location.reload();
    } catch (err) {
      console.error('Repair failed:', err);
      alert(t('agency.repairFailed' as any));
    } finally {
      setIsRepairing(false);
    }
  };

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = showMyClientsOnly ? org.responsibleAgencyUserId === user?.uid : true;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteClient = async () => {
    if (!orgToDelete) return;
    setIsDeleting(true);
    try {
      await deleteOrganization(orgToDelete.id);
      setOrgToDelete(null);
      // The organizations list should refresh if it's using a subscription,
      // otherwise we might need a manual refresh or window reload.
      // useAgencyClients seems to use snapshots or re-fetches.
      window.location.reload();
    } catch (err) {
      console.error('Failed to delete client:', err);
      alert('Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || (loading && userData?.isAgency)) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-surface-500 font-bold uppercase tracking-widest text-xs">
          {t('agency.clients.loading' as any)}
        </p>
      </div>
    );
  }

  if (!authLoading && isAuthenticated && !userData?.isAgency) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-10 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          {t('agency.accessDeniedTitle' as any)}
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
    <div className="space-y-6 animate-in fade-in duration-700">
      <ConfirmationModal
        isOpen={!!orgToDelete}
        onClose={() => setOrgToDelete(null)}
        onConfirm={handleDeleteClient}
        title={t('agency.clients.deleteTitle' as any) || 'Delete Client'}
        description={
          (t(
            'agency.clients.deleteConfirm' as any,
            { name: orgToDelete?.name || '' } as any
          ) as string) ||
          `Are you sure you want to delete ${orgToDelete?.name}? This will deactivate their workspace.`
        }
        confirmText={t('common.delete' as any) || 'Delete'}
        variant="danger"
        isLoading={isDeleting}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white leading-tight">
            {t('agency.clients.title' as any)}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {t('agency.clients.subtitle' as any)}
          </p>
        </div>
        <Link href="/portal/agency/clients/new/">
          <Button className="flex items-center gap-2 shadow-lg shadow-blue-500/20">
            <Plus size={18} />
            {t('agency.clients.onboard' as any)}
          </Button>
        </Link>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">
              {t('sales.metrics.totalRevenue' as any)}
            </span>
          </div>
          <p className="text-2xl font-black">{formatRevenue(totals.totalRevenue)}</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">
              {t('sales.metrics.pendingRevenue' as any)}
            </span>
          </div>
          <p className="text-2xl font-black">{formatRevenue(totals.pendingRevenue)}</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">
              {t('sales.metrics.activeClients' as any)}
            </span>
          </div>
          <p className="text-2xl font-black">{filteredOrgs.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">
              {t('sales.metrics.avgDealSize' as any)}
            </span>
          </div>
          <p className="text-2xl font-black">
            {organizations.filter(o => o.paidCount && o.paidCount > 0).length > 0
              ? formatRevenue(
                  Math.round(
                    totals.totalRevenue /
                      organizations.reduce((sum, o) => sum + (o.paidCount || 0), 0) || 0
                  )
                )
              : '-'}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-surface-900/50 p-4 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm">
        <div className="relative flex-1">
          <Search
            className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400"
            size={18}
          />
          <input
            type="text"
            placeholder={t('agency.clients.searchPlaceholder' as any)}
            className="portal-input ps-11 h-11 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-surface-400 uppercase tracking-widest px-2">
            {filteredOrgs.length} {t('agency.clients.activeAccounts' as any)}
          </div>
          <Button
            variant={showMyClientsOnly ? 'primary' : 'outline'}
            onClick={() => setShowMyClientsOnly(!showMyClientsOnly)}
            className={cn(
              'h-11 transition-all',
              !showMyClientsOnly && 'border-surface-200 dark:border-surface-800 text-surface-500'
            )}
          >
            <Filter size={16} className="me-2" />
            {t('agency.clients.filter.myClients' as any) || 'My Clients'}
          </Button>
          <Button variant="outline" className="h-11 border-surface-200 dark:border-surface-800">
            {t('agency.clients.export' as any)}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrgs.length > 0 ? (
          filteredOrgs.map(org => {
            console.log('[ClientCard] Org ID:', org.id, 'Name:', org.name);
            return (
              <Card
                key={org.id}
                noPadding
                className="border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900 transition-all group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <Briefcase size={28} className="text-blue-600 opacity-80" />
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
                          ? t(`agency.clients.badge.${org.status}` as any)
                          : t('agency.clients.badge.active' as any)}
                      </Badge>
                      {org.responsibleAgencyUserId === user?.uid && (
                        <Badge
                          variant="blue"
                          className="text-[9px] font-black uppercase tracking-widest h-5"
                        >
                          {t('agency.clients.you' as any)}
                        </Badge>
                      )}
                      <div className="text-surface-300 hover:text-surface-900 dark:hover:text-white transition-colors">
                        <Dropdown
                          trigger={<MoreVertical size={18} />}
                          align="right"
                          items={[
                            {
                              label: t('agency.clients.detail.overview' as any),
                              icon: <ArrowUpRight size={16} />,
                              onClick: () => router.push(`/portal/agency/clients/${org.id}/`),
                            },
                            {
                              label: t('agency.clients.viewAsClient' as any),
                              icon: <Eye size={16} />,
                              onClick: () => viewAsClient(org.id),
                            },
                            {
                              label: t('common.delete' as any) || 'Delete',
                              icon: <Trash2 size={16} />,
                              variant: 'danger',
                              onClick: () => setOrgToDelete({ id: org.id, name: org.name }),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2 leading-tight">
                    {org.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-6">
                    <ShieldCheck
                      size={14}
                      className={cn(
                        org.plan === 'enterprise' ? 'text-purple-500' : 'text-emerald-500'
                      )}
                    />
                    <span className="text-xs font-bold text-surface-500 uppercase tracking-widest">
                      {org.plan
                        ? t(`agency.clients.plans.${org.plan}` as any)
                        : t('agency.clients.enterprise' as any)}
                    </span>
                  </div>

                  {/* Revenue Highlight */}
                  {(org.totalRevenue ?? 0) > 0 && (
                    <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-100 dark:border-emerald-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign
                            size={16}
                            className="text-emerald-600 dark:text-emerald-400"
                          />
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">
                            {t('sales.metrics.totalRevenue' as any)}
                          </span>
                        </div>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {formatRevenue(org.totalRevenue || 0)}
                        </span>
                      </div>
                      {(org.pendingRevenue ?? 0) > 0 && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-500/20">
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                            {t('sales.metrics.pending' as any)}
                          </span>
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                            +{formatRevenue(org.pendingRevenue || 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-surface-50 dark:border-surface-800/50">
                    <div>
                      <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">
                        {t('agency.clients.tickets' as any)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-surface-900 dark:text-white">
                          {org.requestCount}
                        </span>
                        <TrendingUp size={14} className="text-emerald-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">
                        {t('agency.clients.members' as any)}
                      </p>
                      <div className="flex items-center gap-2 text-lg font-bold text-surface-900 dark:text-white">
                        <Users size={16} className="text-surface-400" />
                        <span>{org.memberCount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-surface-50/50 dark:bg-surface-900/50 border-t border-surface-50 dark:border-surface-800 rounded-b-2xl group-hover:bg-blue-600 transition-colors">
                  <Link
                    href={`/portal/agency/clients/${org.id}/`}
                    className="flex items-center justify-between group-hover:text-white text-blue-600 dark:text-blue-400 transition-colors"
                  >
                    <span className="text-xs font-black uppercase tracking-widest">
                      {t('agency.clients.detail.overview' as any)}
                    </span>
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center bg-white dark:bg-surface-950 rounded-3xl border border-surface-200 dark:border-surface-800">
            <Users className="w-16 h-16 text-surface-100 dark:text-surface-800 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-surface-900 dark:text-white">
              {t('agency.clients.emptyTitle' as any)}
            </h3>
            <p className="text-surface-500 dark:text-surface-400 text-sm mt-1 max-w-sm mx-auto">
              {t('agency.clients.emptyDesc' as any)}
            </p>
            <Button className="mt-8 h-11 px-8">{t('agency.clients.onboard' as any)}</Button>
          </div>
        )}
      </div>
    </div>
  );
}
