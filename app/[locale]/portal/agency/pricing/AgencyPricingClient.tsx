'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAllPricingRequests } from '@/lib/hooks/usePricingRequests';
import { usePricingMutations } from '@/lib/hooks/usePricingMutations';
import { useAgencyClients } from '@/lib/hooks/useAgencyClients';
import {
  MoreVertical,
  Loader2,
  Filter,
  AlertCircle,
  DollarSign,
  Send,
  Eye,
  Pencil,
  Plus,
  X,
  ChevronRight,
  Calculator,
  Building2,
} from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Avatar } from '@/components/ui/Avatar';
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
import { Organization } from '@/lib/types/portal';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useOrg } from '@/lib/context/OrgContext';
import { getPricingStatusBadgeVariant } from '@/lib/utils/portal-helpers';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { DateDisplay, OrgDisplay, filterAndPaginatePricingRequests } from '@/lib/utils/portal-ui';
import { PortalSearchField } from '@/components/portal/ui/PortalSearchField';
import { ITEMS_PER_PAGE } from '@/lib/constants/pricing';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
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

export default function AgencyPricingClient() {
  const { requests, loading: isLoading, error: requestsError } = useAllPricingRequests();
  const { organizations: agencyOrganizations } = useAgencyClients();
  const { sendPricingRequest } = usePricingMutations();
  const organizations = useMemo(
    () =>
      Object.fromEntries(agencyOrganizations.map(org => [org.id, org])) as Record<
        string,
        Organization
      >,
    [agencyOrganizations]
  );
  const error = requestsError;
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewOfferModal, setShowNewOfferModal] = useState(false);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const t = useTranslations('portal');
  const locale = useLocale();
  const router = useRouter();
  const { switchOrg } = useOrg();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; requestId: string | null }>({
    isOpen: false,
    requestId: null,
  });

  const filters = [
    'All',
    PRICING_STATUS.DRAFT,
    PRICING_STATUS.SENT,
    PRICING_STATUS.ACCEPTED,
    PRICING_STATUS.PAID,
    PRICING_STATUS.DECLINED,
  ];

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const handleSend = (requestId: string) => {
    setConfirmModal({ isOpen: true, requestId });
  };

  const openPricingOffer = (request: PricingRequest, mode: 'view' | 'edit' = 'view') => {
    switchOrg(request.orgId);
    router.push(getPortalPath(`/pricing/${request.id}/${mode === 'edit' ? 'edit/' : ''}`));
  };

  const processSend = async () => {
    const requestId = confirmModal.requestId;
    if (!requestId) return;

    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setProcessingId(requestId);

    try {
      await sendPricingRequest(requestId);
    } finally {
      setProcessingId(null);
    }
  };

  // Type helper for translations
  type PricingStatusKey = Lowercase<'DRAFT' | 'SENT' | 'ACCEPTED' | 'PAID' | 'DECLINED'>;

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = (totalPages: number) => setCurrentPage(p => Math.min(totalPages, p + 1));

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

  const { paginatedRequests, totalPages } = filterAndPaginatePricingRequests(
    requests,
    activeFilter,
    searchQuery,
    organizations,
    currentPage,
    ITEMS_PER_PAGE
  );
  const pendingSendRequest = requests.find(request => request.id === confirmModal.requestId);

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="portal-page-title">{t('pricing.title')}</h1>
          <p className="portal-page-subtitle">
            {t('agency.pricing.subtitle') || 'Manage pricing offers across all clients'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(getPortalPath('/agency/calculator/'))}
          >
            <Calculator size={18} className="me-2" />
            {t('pricing.calculator')}
          </Button>
          <Button onClick={() => setShowNewOfferModal(true)}>
            <Plus size={18} className="me-2" />
            {t('pricing.newOffer')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 min-[920px]:grid-cols-4 gap-3.5">
        <Card className="min-h-[96px] p-3.5 bg-primary-50 dark:bg-primary-950/20 border-primary-200/50 dark:border-primary-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary-600/70 uppercase tracking-wider">
                {t('pricing.form.total')}
              </p>
              <p className="text-xl font-black text-primary-700 dark:text-primary-400 leading-none">
                {statsData.total}
              </p>
            </div>
          </div>
        </Card>

        <Card className="min-h-[96px] p-3.5 bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-wider">
                {t('pricing.status.sent')}
              </p>
              <p className="text-xl font-black text-amber-700 dark:text-amber-400 leading-none">
                {statsData.sent}
              </p>
            </div>
          </div>
        </Card>

        <Card className="min-h-[96px] p-3.5 bg-accent-50 dark:bg-accent-950/20 border-accent-200/50 dark:border-accent-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-accent-500/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-accent-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-accent-600/70 uppercase tracking-wider">
                {t('pricing.status.accepted')}
              </p>
              <p className="text-xl font-black text-accent-700 dark:text-accent-400 leading-none">
                {statsData.accepted}
              </p>
            </div>
          </div>
        </Card>

        <Card className="min-h-[96px] p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-wider">
                {t('agency.pricing.revenue')}
              </p>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 leading-none">
                {formatCurrency(statsData.totalRevenue, 'USD')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card
        noPadding
        className="overflow-visible border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950"
      >
        {/* Toolbar */}
        <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex flex-col lg:flex-row lg:items-center gap-4 bg-surface-50/50 dark:bg-surface-900/50">
          <PortalSearchField
            className="w-full lg:w-96"
            placeholder={t('header.searchPlaceholder')}
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
            <div className="flex items-center gap-1.5 px-3 py-1.5 portal-label-sm shrink-0">
              <Filter size={12} /> {t('common.filter')}:
            </div>
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  'px-3 py-2 min-h-[40px] text-sm font-bold rounded-lg whitespace-nowrap transition-all font-outfit touch-manipulation active:scale-95 shrink-0',
                  activeFilter === filter
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                    : 'text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800'
                )}
              >
                {filter === 'All'
                  ? t('common.all')
                  : t(`pricing.status.${filter.toLowerCase() as PricingStatusKey}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <p className="text-sm font-bold text-surface-400 font-outfit">
                {t('common.loading')}
              </p>
            </div>
          ) : paginatedRequests.length > 0 ? (
            <>
              {/* Mobile View: Cards */}
              <div className="md:hidden space-y-4 p-4">
                {paginatedRequests.map(req => (
                  <Card
                    key={req.id}
                    className="p-4 border-surface-200 dark:border-surface-800 shadow-none bg-surface-50/50 dark:bg-surface-900/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            switchOrg(req.orgId);
                            router.push(getPortalPath(`/pricing/${req.id}/`));
                          }}
                          className="font-bold text-lg text-surface-900 dark:text-white font-outfit text-start"
                        >
                          {req.title}
                        </button>
                        <span className="text-xs font-bold text-surface-400 flex items-center gap-1.5 font-outfit">
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
                      </div>
                      <Badge
                        variant={getPricingStatusBadgeVariant(
                          PRICING_STATUS_CONFIG[req.status]?.color || 'gray'
                        )}
                      >
                        {t(`pricing.status.${req.status.toLowerCase() as PricingStatusKey}`)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Organization */}
                      <div className="space-y-1">
                        <p className="portal-label-sm text-[10px]">{t('agency.clientOrg')}</p>
                        <OrgDisplay
                          orgId={req.orgId}
                          orgName={organizations[req.orgId]?.name || ''}
                          size="sm"
                        />
                      </div>

                      {/* Total Amount */}
                      <div className="space-y-1">
                        <p className="portal-label-sm text-[10px]">{t('pricing.form.total')}</p>
                        <div className="flex items-center gap-1.5">
                          <DollarSign size={14} className="text-green-500 opacity-70" />
                          <span className="text-sm font-bold text-surface-800 dark:text-surface-200 font-outfit">
                            {formatCurrency(req.totalAmount, req.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Created Date */}
                      <div className="space-y-1">
                        <p className="portal-label-sm text-[10px]">{t('common.date')}</p>
                        <DateDisplay
                          timestamp={req.createdAt}
                          locale={locale}
                          formatStr="MMM d, yyyy"
                        />
                      </div>

                      {/* Status Date (Draft/Sent) */}
                      <div className="space-y-1">
                        <p className="portal-label-sm text-[10px]">
                          {req.status === PRICING_STATUS.DRAFT ? 'Status' : 'Sent'}
                        </p>
                        <DateDisplay
                          timestamp={req.status === PRICING_STATUS.DRAFT ? undefined : req.sentAt}
                          locale={locale}
                          formatStr="MMM d"
                          showStatusDateOnly={true}
                          status={req.status}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-200 dark:border-surface-800">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          switchOrg(req.orgId);
                          router.push(getPortalPath(`/pricing/${req.id}/`));
                        }}
                      >
                        <Eye size={16} className="me-2" />
                        {t('common.view')}
                      </Button>

                      {(req.status === PRICING_STATUS.DRAFT ||
                        req.status === PRICING_STATUS.SENT) && (
                        <Button
                          size="sm"
                          onClick={() => handleSend(req.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Send size={16} className="me-2" />
                          {req.status === PRICING_STATUS.SENT
                            ? t('pricing.form.resendToClient')
                            : t('pricing.form.sendToClient')}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block">
                <PortalTable className="border-0 shadow-none bg-transparent rounded-none overflow-visible">
                  <PortalTableScroll>
                    <PortalTableElement>
                      <PortalTableHeader className="bg-surface-50/50 dark:bg-surface-900/50">
                        <PortalTableRow className="cursor-default">
                          <PortalTableHead headStyle="label">
                            {t('pricing.form.titleLabel')}
                          </PortalTableHead>
                          <PortalTableHead headStyle="label">{t('agency.clientOrg')}</PortalTableHead>
                          <PortalTableHead headStyle="label" cellAlign="center">
                            {t('common.status')}
                          </PortalTableHead>
                          <PortalTableHead headStyle="label" cellAlign="center">
                            {t('pricing.form.total')}
                          </PortalTableHead>
                          <PortalTableHead headStyle="label" cellAlign="center">
                            {t('common.date')}
                          </PortalTableHead>
                          <PortalTableHead headStyle="label" cellAlign="end">
                            {t('common.actions')}
                          </PortalTableHead>
                        </PortalTableRow>
                      </PortalTableHeader>
                      <PortalTableBody>
                        {paginatedRequests.map(req => (
                          <PortalTableRow key={req.id} hover>
                            <PortalTableCell>
                              <button
                                onClick={() => {
                                  switchOrg(req.orgId);
                                  router.push(getPortalPath(`/pricing/${req.id}/`));
                                }}
                                className="flex flex-col max-w-md text-start"
                              >
                                <span className="font-bold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate font-outfit">
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
                            </PortalTableCell>
                            <PortalTableCell>
                              <OrgDisplay
                                orgId={req.orgId}
                                orgName={organizations[req.orgId]?.name || ''}
                                size="md"
                              />
                            </PortalTableCell>
                            <PortalTableCell cellAlign="center">
                              <Badge
                                variant={getPricingStatusBadgeVariant(
                                  PRICING_STATUS_CONFIG[req.status]?.color || 'gray'
                                )}
                              >
                                {t(`pricing.status.${req.status.toLowerCase() as PricingStatusKey}`)}
                              </Badge>
                            </PortalTableCell>
                            <PortalTableCell cellAlign="center">
                              <div className="flex items-center justify-center gap-2">
                                <DollarSign size={14} className="text-green-500 opacity-70" />
                                <span className="text-sm font-bold text-surface-800 dark:text-surface-200 font-outfit">
                                  {formatCurrency(req.totalAmount, req.currency)}
                                </span>
                              </div>
                            </PortalTableCell>
                            <PortalTableCell cellAlign="center">
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-bold text-surface-800 dark:text-surface-200 font-outfit whitespace-nowrap">
                                  <DateDisplay
                                    timestamp={req.createdAt}
                                    locale={locale}
                                    formatStr="MMM d, yyyy"
                                  />
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
                            </PortalTableCell>
                            <PortalTableCell cellAlign="end">
                              <div className="flex items-center justify-end gap-1">
                                <IconButton
                                  icon={Eye}
                                  label={t('common.view')}
                                  variant="ghost"
                                  size="sm"
                                  iconSize={16}
                                  className="min-w-[44px] min-h-[44px] hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                  onClick={() => openPricingOffer(req)}
                                />
                                {(req.status === PRICING_STATUS.DRAFT ||
                                  req.status === PRICING_STATUS.SENT) && (
                                  <IconButton
                                    icon={Send}
                                    label={
                                      req.status === PRICING_STATUS.SENT
                                        ? t('pricing.form.resendToClient')
                                        : t('pricing.form.sendToClient')
                                    }
                                    variant="success"
                                    size="sm"
                                    iconSize={16}
                                    className="min-w-[44px] min-h-[44px]"
                                    onClick={() => handleSend(req.id)}
                                  />
                                )}
                                <Dropdown
                                  trigger={
                                    <IconButton
                                      icon={MoreVertical}
                                      label={t('common.actions')}
                                      variant="ghost"
                                      size="sm"
                                      iconSize={16}
                                      className="min-w-[44px] min-h-[44px]"
                                    />
                                  }
                                  items={[
                                    {
                                      label: t('common.view'),
                                      icon: <Eye size={14} />,
                                      onClick: () => openPricingOffer(req),
                                    },
                                    ...(req.status === PRICING_STATUS.DRAFT ||
                                    req.status === PRICING_STATUS.SENT
                                      ? [
                                          {
                                            label: t('common.edit'),
                                            icon: <Pencil size={14} />,
                                            onClick: () => openPricingOffer(req, 'edit'),
                                          },
                                          {
                                            label:
                                              req.status === PRICING_STATUS.SENT
                                                ? t('pricing.form.resendToClient')
                                                : t('pricing.form.sendToClient'),
                                            icon: <Send size={14} />,
                                            onClick: () => handleSend(req.id),
                                          },
                                        ]
                                      : []),
                                  ]}
                                  align="right"
                                />
                              </div>
                            </PortalTableCell>
                          </PortalTableRow>
                        ))}
                      </PortalTableBody>
                    </PortalTableElement>
                  </PortalTableScroll>
                </PortalTable>
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
                  {t('pricing.noOffersAgency')}
                </p>
                <Button onClick={() => setShowNewOfferModal(true)} className="mt-4">
                  <Plus size={16} className="me-2" />
                  {t('pricing.newOffer')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        {!isLoading && paginatedRequests.length > 0 && (
          <div className="p-5 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-50/30 dark:bg-surface-900/30">
            <span className="portal-label-sm text-[10px]">
              {t('common.showing', {
                count: paginatedRequests.length,
                total: paginatedRequests.length,
              })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 text-[10px] font-black uppercase tracking-widest"
                onClick={() => handlePrevPage()}
                disabled={currentPage === 1}
              >
                {t('common.prev')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-4 text-[10px] font-black uppercase tracking-widest"
                onClick={() => handleNextPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* New Offer - Organization Selection Modal */}
      {showNewOfferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white font-outfit">
                  {t('pricing.selectClient')}
                </h2>
                <p className="text-sm text-surface-500 mt-1">{t('pricing.selectClientDesc')}</p>
              </div>
              <button
                onClick={() => setShowNewOfferModal(false)}
                className="portal-focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center  p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
              >
                <X size={20} className="text-surface-500" />
              </button>
            </div>

            <div className="p-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50">
              <PortalSearchField
                placeholder={t('header.searchPlaceholder')}
                value={orgSearchQuery}
                onChange={setOrgSearchQuery}
                inputClassName="h-10"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {Object.values(organizations)
                .filter(org => org.name.toLowerCase().includes(orgSearchQuery.toLowerCase()))
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
                    <Avatar name={org.name} size="md" />
                    <div className="flex-1">
                      <p className="font-bold text-surface-900 dark:text-white font-outfit group-hover:text-primary-600 transition-colors">
                        {org.name}
                      </p>
                      <p className="text-xs text-surface-500">{org.id.slice(0, 8)}...</p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-surface-300 group-hover:text-primary-500"
                    />
                  </button>
                ))}
              {Object.values(organizations).length === 0 && (
                <div className="text-center py-8 text-surface-500">No organizations found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, requestId: null })}
        onConfirm={processSend}
        title={t('pricing.form.sendConfirm')}
        description={t('pricing.form.sendConfirm')}
        confirmText={
          pendingSendRequest?.status === PRICING_STATUS.SENT
            ? t('pricing.form.resendToClient')
            : t('pricing.form.sendToClient')
        }
        cancelText={t('common.cancel')}
        isLoading={!!processingId}
      />
    </div>
  );
}
