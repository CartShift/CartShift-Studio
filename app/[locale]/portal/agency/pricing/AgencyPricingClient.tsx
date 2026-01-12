'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  MoreVertical,
  Loader2,
  Filter,
  AlertCircle,
  DollarSign,
  Send,
  Eye,
  Building2,
  Plus,
  X,
  ChevronRight,
} from 'lucide-react';
import { PortalAvatar } from '@/components/portal/ui/PortalAvatar';
import { PortalCard } from '@/components/portal/ui/PortalCard';
import { PortalButton } from '@/components/portal/ui/PortalButton';
import { PortalBadge } from '@/components/portal/ui/PortalBadge';
import {
  PricingRequest,
  PRICING_STATUS_CONFIG,
  PRICING_STATUS,
  formatCurrency,
} from '@/lib/types/pricing';
import { subscribeToAllPricingRequests, sendPricingRequest } from '@/lib/services/pricing-requests';
import { getAllOrganizations } from '@/lib/services/portal-organizations';
import { Organization } from '@/lib/types/portal';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useOrg } from '@/lib/context/OrgContext';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
// Centralized utilities
import { getPricingStatusBadgeVariant } from '@/lib/utils/portal-helpers';
import { getPortalPath } from '@/lib/utils/portal-paths';

// mapStatusColor moved to lib/utils/portal-helpers.ts

export default function AgencyPricingClient() {
  const [requests, setRequests] = useState<PricingRequest[]>([]);
  const [organizations, setOrganizations] = useState<Record<string, Organization>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewOfferModal, setShowNewOfferModal] = useState(false);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const itemsPerPage = 10;
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { switchOrg } = useOrg();
  const { isAuthenticated, loading: authLoading } = usePortalAuth();

  const filters = [
    'All',
    PRICING_STATUS.DRAFT,
    PRICING_STATUS.SENT,
    PRICING_STATUS.ACCEPTED,
    PRICING_STATUS.PAID,
    PRICING_STATUS.DECLINED,
  ];

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    async function fetchOrganizations() {
      try {
        const orgs = await getAllOrganizations();
        const orgsMap: Record<string, Organization> = {};
        orgs.forEach(org => {
          orgsMap[org.id] = org;
        });
        setOrganizations(orgsMap);
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
      }
    }
    fetchOrganizations();
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToAllPricingRequests(data => {
        setRequests(data);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to subscribe to pricing requests:', err);
      setError(t('portal.common.error'));
      setLoading(false);
      return undefined;
    }
  }, [t]);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const handleSend = async (requestId: string) => {
    try {
      if (!confirm('Send this pricing offer to the client?')) return;
      await sendPricingRequest(requestId);
    } catch (err) {
      console.error('Failed to send pricing request:', err);
      alert('Failed to send. Please try again.');
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesFilter = activeFilter === 'All' || req.status === activeFilter;
    const orgName = organizations[req.orgId]?.name || '';
    const matchesSearch =
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      orgName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  // Stats
  const statsData = {
    total: requests.length,
    draft: requests.filter(r => r.status === PRICING_STATUS.DRAFT).length,
    sent: requests.filter(r => r.status === PRICING_STATUS.SENT).length,
    accepted: requests.filter(r => r.status === PRICING_STATUS.ACCEPTED).length,
    paid: requests.filter(r => r.status === PRICING_STATUS.PAID).length,
    totalRevenue: requests
      .filter(r => r.status === PRICING_STATUS.PAID)
      .reduce((sum, r) => sum + r.totalAmount, 0),
  };

  if (error) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
          {t('portal.common.error')}
        </h2>
        <p className="text-surface-500 dark:text-surface-400 max-w-sm">{error}</p>
        <PortalButton onClick={() => window.location.reload()}>
          {t('portal.common.retry')}
        </PortalButton>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white font-outfit">
            {t('portal.pricing.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1 font-medium">
            {t('portal.agency.pricing.subtitle' as never) ||
              'Manage pricing offers across all clients'}
          </p>
        </div>
        <PortalButton onClick={() => setShowNewOfferModal(true)}>
          <Plus size={18} className="me-2" />
          {t('portal.pricing.newOffer')}
        </PortalButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PortalCard className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200/50 dark:border-blue-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest">
                {t('portal.common.total' as never)}
              </p>
              <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
                {statsData.total}
              </p>
            </div>
          </div>
        </PortalCard>

        <PortalCard className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest">
                {t('portal.pricing.status.sent')}
              </p>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400">
                {statsData.sent}
              </p>
            </div>
          </div>
        </PortalCard>

        <PortalCard className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200/50 dark:border-purple-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-purple-600/70 uppercase tracking-widest">
                {t('portal.pricing.status.accepted')}
              </p>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-400">
                {statsData.accepted}
              </p>
            </div>
          </div>
        </PortalCard>

        <PortalCard className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200/50 dark:border-emerald-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">
                {t('portal.agency.pricing.revenue')}
              </p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {formatCurrency(statsData.totalRevenue, 'USD')}
              </p>
            </div>
          </div>
        </PortalCard>
      </div>

      {/* Main Table Card */}
      <PortalCard
        noPadding
        className="overflow-visible border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950"
      >
        {/* Toolbar */}
        <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex flex-col lg:flex-row lg:items-center gap-4 bg-surface-50/50 dark:bg-surface-900/50">
          <div className="relative w-full lg:w-96">
            <Search
              className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400"
              size={16}
            />
            <input
              type="text"
              placeholder={t('portal.header.searchPlaceholder')}
              className="portal-input ps-10 h-10 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 font-medium w-full font-outfit"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-surface-400 uppercase tracking-widest shrink-0">
              <Filter size={12} /> {t('portal.common.filter')}:
            </div>
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  'px-3 py-2 min-h-[40px] text-sm font-bold rounded-lg whitespace-nowrap transition-all font-outfit touch-manipulation active:scale-95 shrink-0',
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800'
                )}
              >
                {filter === 'All'
                  ? t('portal.common.all')
                  : t(`portal.pricing.status.${filter.toLowerCase()}` as never)}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-bold text-surface-400 font-outfit">
                {t('portal.common.loading')}
              </p>
            </div>
          ) : filteredRequests.length > 0 ? (
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-surface-50/50 dark:bg-surface-900/50 cursor-default">
                  <th className="px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest">
                    {t('portal.pricing.form.titleLabel')}
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest">
                    {t('portal.agency.clientOrg')}
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest text-center">
                    {t('portal.common.status')}
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest text-center">
                    {t('portal.pricing.form.total')}
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest text-center">
                    {t('portal.common.date')}
                  </th>
                  <th className="px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest text-end">
                    {t('portal.common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {paginatedRequests.map(req => (
                  <tr
                    key={req.id}
                    className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-all group"
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          switchOrg(req.orgId);
                          router.push(getPortalPath(`/pricing/${req.id}/`));
                        }}
                        className="flex flex-col max-w-md text-start"
                      >
                        <span className="font-bold text-surface-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate font-outfit">
                          {req.title}
                        </span>
                        <span className="text-xs font-bold text-surface-400 flex items-center gap-1.5 mt-1 font-outfit">
                          <span className="font-mono bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-[10px] tracking-tight">
                            {req.id.slice(0, 8)}
                          </span>
                          {req.requestIds && req.requestIds.length > 0 && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-surface-300" />
                              <span>{req.requestIds.length} requests</span>
                            </>
                          )}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {(organizations[req.orgId]?.name || '?')[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-surface-700 dark:text-surface-300 truncate max-w-[150px]">
                          {organizations[req.orgId]?.name || t('portal.common.unknown')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <PortalBadge
                          variant={getPricingStatusBadgeVariant(
                            PRICING_STATUS_CONFIG[req.status]?.color || 'gray'
                          )}
                        >
                          {t(`portal.pricing.status.${req.status.toLowerCase()}` as never)}
                        </PortalBadge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <DollarSign size={14} className="text-green-500 opacity-70" />
                        <span className="text-sm font-bold text-surface-800 dark:text-surface-200 font-outfit">
                          {formatCurrency(req.totalAmount, req.currency)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-surface-800 dark:text-surface-200 font-outfit whitespace-nowrap">
                          {req.createdAt?.toDate
                            ? format(req.createdAt.toDate(), 'MMM d, yyyy', {
                                locale: getDateLocale(locale),
                              })
                            : t('portal.common.recently')}
                        </span>
                        <span className="text-[10px] font-black text-surface-400 uppercase tracking-tighter">
                          {req.status === PRICING_STATUS.DRAFT
                            ? t('portal.pricing.status.draft')
                            : req.sentAt?.toDate
                              ? format(req.sentAt.toDate(), 'MMM d', {
                                  locale: getDateLocale(locale),
                                })
                              : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            switchOrg(req.orgId);
                            router.push(getPortalPath(`/pricing/${req.id}/`));
                          }}
                          className="p-2 text-surface-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Eye size={16} />
                        </button>
                        {req.status === PRICING_STATUS.DRAFT && (
                          <button
                            onClick={() => handleSend(req.id)}
                            className="p-2 text-surface-400 hover:text-green-600 dark:hover:text-green-400 transition-all rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <Send size={16} />
                          </button>
                        )}
                        <button className="p-2 text-surface-400 hover:text-surface-900 dark:hover:text-white transition-all rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4 space-y-4">
              <div className="w-20 h-20 bg-surface-50 dark:bg-surface-900 rounded-3xl flex items-center justify-center mb-2 border border-surface-100 dark:border-surface-800 shadow-inner">
                <DollarSign className="text-surface-200 dark:text-surface-800" size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
                  {t('portal.common.noData')}
                </h3>
                <p className="text-surface-500 dark:text-surface-400 text-sm max-w-sm font-medium">
                  {t('portal.pricing.noOffersAgency')}
                </p>
                <PortalButton onClick={() => setShowNewOfferModal(true)} className="mt-4">
                  <Plus size={16} className="me-2" />
                  {t('portal.pricing.newOffer')}
                </PortalButton>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        {!loading && filteredRequests.length > 0 && (
          <div className="p-5 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-50/30 dark:bg-surface-900/30">
            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
              {t('portal.common.showing', {
                count: paginatedRequests.length,
                total: filteredRequests.length,
              })}
            </span>
            <div className="flex items-center gap-2">
              <PortalButton
                variant="outline"
                size="sm"
                className="h-8 px-4 text-[10px] font-black uppercase tracking-widest"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                {t('portal.common.prev')}
              </PortalButton>
              <PortalButton
                variant="outline"
                size="sm"
                className="h-8 px-4 text-[10px] font-black uppercase tracking-widest"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                {t('portal.common.next')}
              </PortalButton>
            </div>
          </div>
        )}
      </PortalCard>


      {/* New Offer - Organization Selection Modal */}
      {showNewOfferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white font-outfit">
                  {t('pricing.selectClient')}
                </h2>
                <p className="text-sm text-surface-500 mt-1">
                  {t('pricing.selectClientDesc')}
                </p>
              </div>
              <button
                onClick={() => setShowNewOfferModal(false)}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
              >
                <X size={20} className="text-surface-500" />
              </button>
            </div>

            <div className="p-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
              <div className="relative">
                <Search
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder={t('portal.common.search') + '...'}
                  className="portal-input ps-10 h-10 w-full"
                  value={orgSearchQuery}
                  onChange={e => setOrgSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {Object.values(organizations)
                .filter(org =>
                  org.name.toLowerCase().includes(orgSearchQuery.toLowerCase())
                )
                .map(org => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setShowNewOfferModal(false);
                      switchOrg(org.id);
                      router.push(getPortalPath('/pricing/new/'));
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group text-start"
                  >
                    <PortalAvatar name={org.name} size="md" />
                    <div className="flex-1">
                      <p className="font-bold text-surface-900 dark:text-white font-outfit group-hover:text-blue-600 transition-colors">
                        {org.name}
                      </p>
                      <p className="text-xs text-surface-500">
                        {org.id.slice(0, 8)}...
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-surface-300 group-hover:text-blue-500" />
                  </button>
                ))}
                {Object.values(organizations).length === 0 && (
                   <div className="text-center py-8 text-surface-500">
                      No organizations found.
                   </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
