'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Loader2,
  Filter,
  AlertCircle,
  DollarSign,
  Send,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import {
  PricingRequest,
  PRICING_STATUS_CONFIG,
  PRICING_STATUS,
  formatCurrency,
} from '@/lib/types/pricing';
import {
  subscribeToOrgPricingRequests,
  sendPricingRequest,
  deletePricingRequest,
} from '@/lib/services/pricing-requests';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/navigation';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
// Centralized utilities
import { getPricingStatusBadgeVariant } from '@/lib/utils/portal-helpers';
import { getPortalPath } from '@/lib/utils/portal-paths';

// mapStatusColor moved to lib/utils/portal-helpers.ts

export default function PricingListClient() {
  const orgId = useResolvedOrgId();
  const router = useRouter();
  const [requests, setRequests] = useState<PricingRequest[]>([]);
  const [loading, set] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const t = useTranslations('portal');
  const locale = useLocale();
  const { isAgency } = usePortalAuth();

  const filters = [
    'All',
    PRICING_STATUS.DRAFT,
    PRICING_STATUS.SENT,
    PRICING_STATUS.ACCEPTED,
    PRICING_STATUS.PAID,
  ];

  useEffect(() => {
    if (!orgId || typeof orgId !== 'string') return undefined;

    set(true);
    setError(null);

    try {
      // Agency sees all requests, clients only see non-drafts
      const unsubscribe = subscribeToOrgPricingRequests(
        orgId,
        data => {
          setRequests(data);
          set(false);
        },
        { excludeDrafts: !isAgency }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to subscribe to pricing requests:', err);
      setError(t('common.error'));
      set(false);
      return undefined;
    }
  }, [orgId, isAgency, t]);

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
      toast.error(t('pricing.form.sendFailed'));
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm(t('pricing.form.deleteConfirm'))) return;
    try {
      await deletePricingRequest(requestId);
    } catch (err) {
      console.error('Failed to delete pricing request:', err);
      toast.error(t('pricing.form.deleteFailed'));
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesFilter = activeFilter === 'All' || req.status === activeFilter;
    const matchesSearch =
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  if (error) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
          {t('common.error')}
        </h2>
        <p className="text-surface-500 dark:text-surface-400 max-w-sm">{error}</p>
        <Button onClick={() => window.location.reload()}>{t('common.retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white font-outfit">
            {t('pricing.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1 font-medium">
            {t('pricing.subtitle')}
          </p>
        </div>
        {isAgency && (
          <Link href={getPortalPath('/pricing/new/')}>
            <Button className="flex items-center gap-2 shadow-lg shadow-blue-500/20 font-outfit">
              <Plus size={18} />
              {t('pricing.newOffer')}
            </Button>
          </Link>
        )}
      </div>

      <Card
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
              placeholder={t('header.searchPlaceholder')}
              className="portal-input ps-10 h-10 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 font-medium w-full font-outfit"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-surface-400 uppercase tracking-widest shrink-0">
              <Filter size={12} /> {t('common.filter')}:
            </div>
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  'px-3 py-2.5 min-h-[40px] text-sm font-bold rounded-lg whitespace-nowrap transition-all font-outfit shrink-0 touch-manipulation active:scale-95',
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800'
                )}
              >
                {filter === 'All'
                  ? t('common.all')
                  : t(`pricing.status.${filter.toLowerCase()}` as never)}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="w-full min-w-0">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-bold text-surface-400 font-outfit">
                {t('common.loading')}
              </p>
            </div>
          ) : filteredRequests.length > 0 ? (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {paginatedRequests.map(req => (
                  <div
                    key={req.id}
                    onClick={() => router.push(getPortalPath(`/pricing/${req.id}/`))}
                    className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-col min-w-0 me-2">
                        <span className="font-bold text-surface-900 dark:text-white font-outfit truncate text-sm">
                          {req.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          {req.clientName && (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 truncate max-w-[100px]">
                              {req.clientName}
                            </span>
                          )}
                          <span className="font-mono bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-[10px] tracking-tight text-surface-500">
                            {req.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={getPricingStatusBadgeVariant(
                          PRICING_STATUS_CONFIG[req.status]?.color || 'gray'
                        )}
                        className="text-[10px] shrink-0"
                      >
                        {t(`pricing.status.${req.status.toLowerCase()}` as never)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                          {t('pricing.form.total')}
                        </span>
                        <span className="text-sm font-bold text-surface-900 dark:text-white font-outfit">
                          {formatCurrency(req.totalAmount, req.currency)}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
                          {t('common.date')}
                        </span>
                        <span className="text-xs font-bold text-surface-600 dark:text-surface-300 font-outfit">
                          {req.createdAt?.toDate
                            ? format(req.createdAt.toDate(), 'MMM d, yyyy')
                            : t('common.recently')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-start border-collapse">
                  <thead>
                    <tr className="bg-surface-50/50 dark:bg-surface-900/50 cursor-default">
                      <th className="px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest">
                        {t('pricing.form.titleLabel')}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest text-center">
                        {t('common.status')}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest text-center">
                        {t('pricing.form.total')}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest text-center">
                        {t('common.date')}
                      </th>
                      <th className="px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest text-end">
                        {t('common.actions')}
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
                          <Link
                            href={getPortalPath(`/pricing/${req.id}/`)}
                            className="flex flex-col max-w-md"
                          >
                            <span className="font-bold text-surface-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate font-outfit">
                              {req.title}
                            </span>
                            <span className="text-xs font-bold text-surface-400 flex items-center gap-1.5 mt-1 font-outfit">
                              {req.clientName && (
                                <>
                                  <span className="truncate">{req.clientName}</span>
                                  <span className="w-1 h-1 rounded-full bg-surface-300" />
                                </>
                              )}
                              <span className="font-mono bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-[10px] tracking-tight">
                                {req.id.slice(0, 8)}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <Badge
                              variant={getPricingStatusBadgeVariant(
                                PRICING_STATUS_CONFIG[req.status]?.color || 'gray'
                              )}
                            >
                              {t(`pricing.status.${req.status.toLowerCase()}` as never)}
                            </Badge>
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
                                : t('common.recently')}
                            </span>
                            <span className="text-[10px] font-black text-surface-400 uppercase tracking-tighter">
                              {req.status === PRICING_STATUS.DRAFT
                                ? t('pricing.status.draft')
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
                            <Link href={getPortalPath(`/pricing/${req.id}/`)}>
                              <button className="p-2 text-surface-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                <Eye size={16} />
                              </button>
                            </Link>
                            {isAgency &&
                              (req.status === PRICING_STATUS.DRAFT ||
                                req.status === PRICING_STATUS.SENT) && (
                                <Link href={getPortalPath(`/pricing/${req.id}/edit`)}>
                                  <button className="p-2 text-surface-400 hover:text-amber-600 dark:hover:text-amber-400 transition-all rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20">
                                    <Pencil size={16} />
                                  </button>
                                </Link>
                              )}
                            {isAgency && req.status === PRICING_STATUS.DRAFT && (
                              <button
                                onClick={() => handleSend(req.id)}
                                className="p-2 text-surface-400 hover:text-green-600 dark:hover:text-green-400 transition-all rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                <Send size={16} />
                              </button>
                            )}
                            <Dropdown
                              trigger={
                                <button className="p-2 text-surface-400 hover:text-surface-900 dark:hover:text-white transition-all rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800">
                                  <MoreVertical size={16} />
                                </button>
                              }
                              items={[
                                {
                                  label: t('common.view'),
                                  icon: <Eye size={14} />,
                                  onClick: () => router.push(getPortalPath(`/pricing/${req.id}`)),
                                },
                                ...(isAgency &&
                                (req.status === PRICING_STATUS.DRAFT ||
                                  req.status === PRICING_STATUS.SENT)
                                  ? [
                                      {
                                        label: t('common.edit'),
                                        icon: <Pencil size={14} />,
                                        onClick: () =>
                                          router.push(getPortalPath(`/pricing/${req.id}/edit`)),
                                      },
                                    ]
                                  : []),
                                ...(isAgency && req.status === PRICING_STATUS.DRAFT
                                  ? [
                                      {
                                        label: 'Send to Client',
                                        icon: <Send size={14} />,
                                        onClick: () => handleSend(req.id),
                                      },
                                    ]
                                  : []),
                                ...(isAgency
                                  ? [
                                      {
                                        label: t('common.delete'),
                                        icon: <Trash2 size={14} />,
                                        variant: 'danger' as const,
                                        onClick: () => handleDelete(req.id),
                                      },
                                    ]
                                  : []),
                              ]}
                              align="right"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center px-4 space-y-4">
              <div className="w-20 h-20 bg-surface-50 dark:bg-surface-900 rounded-3xl flex items-center justify-center mb-2 border border-surface-100 dark:border-surface-800 shadow-inner">
                <DollarSign className="text-surface-200 dark:text-surface-800" size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
                  {t('common.noData')}
                </h3>
                <p className="text-surface-500 dark:text-surface-400 text-sm max-w-sm font-medium">
                  {isAgency ? t('pricing.noOffersAgency') : t('pricing.noOffersClient')}
                </p>
              </div>
              {isAgency && !searchQuery && activeFilter === 'All' && (
                <Link href={getPortalPath('/pricing/new/')} className="pt-4">
                  <Button className="h-11 px-8 font-outfit shadow-lg shadow-blue-500/10">
                    {t('pricing.newOffer')}
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
        {/* Footer info */}
        {!loading && filteredRequests.length > 0 && (
          <div className="p-5 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-50/30 dark:bg-surface-900/30">
            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">
              {t('common.showing', {
                count: paginatedRequests.length,
                total: filteredRequests.length,
              })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 text-[10px] font-black uppercase tracking-widest"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                {t('common.prev')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 text-[10px] font-black uppercase tracking-widest"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
