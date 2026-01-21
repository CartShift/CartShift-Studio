'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, Loader2, ShieldCheck, Users, Ticket, TrendingUp } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { deleteOrganization } from '@/lib/services/portal-organizations';
import { RevenueSummary } from '@/components/portal/clients/RevenueSummary';
import { ClientsFilterBar } from '@/components/portal/clients/ClientsFilterBar';
import { ClientCard } from '@/components/portal/clients/ClientCard';
import { ClientList } from '@/components/portal/clients/ClientList';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { MoreVertical, ArrowUpRight, Eye, Trash2 } from 'lucide-react';

// Helper component for Client Action Menu to reduce interaction code duplication
const ClientActionMenu = ({
  org,
  onViewAsClient,
  onDelete,
  t,
  router,
}: {
  org: { id: string; name: string; [key: string]: any };
  onViewAsClient: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  t: ReturnType<typeof useTranslations<'portal'>>;
  router: ReturnType<typeof useRouter>;
}) => (
  <Dropdown
    trigger={
      <button className="text-surface-400 hover:text-surface-900 dark:hover:text-white p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
        <MoreVertical size={20} />
      </button>
    }
    align="right"
    items={[
      {
        label: t('agency.clients.detail.overview'),
        icon: <ArrowUpRight size={14} />,
        onClick: () => router.push(`/portal/agency/clients/${org.id}/`),
      },
      {
        label: t('agency.clients.viewAsClient'),
        icon: <Eye size={14} />,
        onClick: () => onViewAsClient(org.id),
      },
      {
        label: t('common.delete') || 'Delete',
        icon: <Trash2 size={14} />,
        variant: 'danger',
        onClick: () => onDelete(org.id, org.name),
      },
    ]}
  />
);
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useAgencyClients } from '@/lib/hooks/useAgencyClients';
import { useImpersonation } from '@/lib/context/ImpersonationContext';

export default function AgencyClientsClient() {
  const t = useTranslations('portal');
  const router = useRouter();
  const { loading: auth, isAuthenticated, user, isImpersonating } = usePortalAuth();
  const { organizations, loading: clients, userData } = useAgencyClients();
  const { viewAsClient } = useImpersonation();

  const handleRefresh = useCallback(async () => {
    // Force a reload of the window for now as the simplest refresh strategy
    // Or invalidating queries if we used React Query
    window.location.reload();
  }, []);

  const formatRev = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toLocaleString()}`;
  };

  const [loading, set] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyClientsOnly, setShowMyClientsOnly] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<{ id: string; name: string } | null>(null);
  const [is, setIs] = useState(false);

  useEffect(() => {
    // Sync loading state or use derived state
    if (!auth && !clients) {
      set(false);
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
          name: user.displayName || t('common.agencyAdmin'),
          createdAt: new Date(),
        });
      }
      window.location.reload();
    } catch (err) {
      console.error('Repair failed:', err);
      alert(t('agency.repairFailed'));
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
    setIs(true);
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
      setIs(false);
    }
  };

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (auth || (loading && userData?.isAgency)) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-surface-500 font-bold uppercase tracking-widest text-xs">
          {t('agency.clients.loading')}
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
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6 animate-in fade-in duration-700 pb-10">
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
          is={is}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white leading-tight">
              {t('agency.clients.title')}
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1">
              {t('agency.clients.subtitle')}
            </p>
          </div>
          <Link href="/portal/agency/clients/new/">
            <Button className="flex items-center gap-2 shadow-lg shadow-blue-500/20">
              <Plus size={18} />
              {t('agency.clients.onboard')}
            </Button>
          </Link>
        </div>

        {/* Revenue Summary */}
        <RevenueSummary
          totalRevenue={totals.totalRevenue}
          activeClients={filteredOrgs.length}
          avgDealSize={
            organizations.filter(o => o.paidCount && o.paidCount > 0).length > 0
              ? Math.round(
                  totals.totalRevenue /
                    organizations.reduce((sum, o) => sum + (o.paidCount || 0), 0) || 0
                )
              : 0
          }
        />

        {/* Filter & View Mode */}
        <ClientsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showMyClientsOnly={showMyClientsOnly}
          onToggleMyClients={() => setShowMyClientsOnly(!showMyClientsOnly)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeCount={filteredOrgs.length}
        />

        {/* Client List/Grid */}
        {filteredOrgs.length > 0 ? (
          <>
            {/* Mobile View (Always List) */}
            <div className="md:hidden space-y-3">
              {filteredOrgs.map(org => (
                <div
                  key={org.id}
                  className="flex flex-col gap-3 p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm"
                >
                  {/* Top Row: Identity & Actions */}
                  <div className="flex items-start justify-between">
                    <div
                      className="flex items-center gap-3"
                      onClick={() => router.push(`/portal/agency/clients/${org.id}/`)}
                    >
                      <Avatar
                        src={org.logoUrl}
                        name={org.name}
                        size="md"
                        className="rounded-xl border border-surface-200 dark:border-surface-700 mt-1"
                      />
                      <div>
                        <h3 className="font-bold text-surface-900 dark:text-white truncate text-base leading-tight mb-1">
                          {org.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={org.status === 'inactive' ? 'gray' : 'green'}
                            className="text-[9px] font-black uppercase tracking-widest h-4 px-1.5"
                          >
                            {org.status ? t(`agency.clients.badge.${org.status}` as any) : 'Active'}
                          </Badge>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                            <ShieldCheck
                              size={12}
                              className={
                                org.plan === 'enterprise' ? 'text-purple-500' : 'text-emerald-500'
                              }
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                              {org.plan ? t(`agency.clients.plans.${org.plan}` as any) : 'Basic'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <ClientActionMenu
                      org={org}
                      onViewAsClient={viewAsClient}
                      onDelete={(id, name) => setOrgToDelete({ id, name })}
                      t={t}
                      router={router}
                    />
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full bg-surface-100 dark:bg-surface-800" />

                  {/* Bottom Row: Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-surface-400 font-black uppercase tracking-widest mb-0.5">
                        {t('sales.metrics.revenue')}
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-surface-900 dark:text-white">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span>{formatRev(org.totalRevenue || 0)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-surface-400 font-black uppercase tracking-widest mb-0.5">
                        {t('agency.clients.tickets')}
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-surface-900 dark:text-white">
                        <Ticket size={14} className="text-blue-500" />
                        <span>{org.requestCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View (Grid/List Toggle) */}
            <div className="hidden md:block">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredOrgs.map(org => (
                    <ClientCard
                      key={org.id}
                      client={org}
                      isMyClient={org.responsibleAgencyUserId === user?.uid}
                      onViewAsClient={viewAsClient}
                      onDelete={(id, name) => setOrgToDelete({ id, name })}
                    />
                  ))}
                </div>
              ) : (
                <ClientList
                  clients={filteredOrgs}
                  currentUserId={user?.uid}
                  onViewAsClient={viewAsClient}
                  onDelete={(id, name) => setOrgToDelete({ id, name })}
                />
              )}
            </div>
          </>
        ) : (
          <div className="col-span-full py-20 text-center bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 border-dashed">
            <Users className="w-16 h-16 text-surface-100 dark:text-surface-800 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-surface-900 dark:text-white">
              {t('agency.clients.emptyTitle')}
            </h3>
            <p className="text-surface-500 dark:text-surface-400 text-sm mt-1 max-w-sm mx-auto">
              {t('agency.clients.emptyDesc')}
            </p>
            <Link href="/portal/agency/clients/new/">
              <Button className="mt-8 h-11 px-8" variant="outline">
                {t('agency.clients.onboard')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
