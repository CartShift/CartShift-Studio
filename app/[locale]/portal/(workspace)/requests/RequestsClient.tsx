'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from '@/lib/motion';
import { skeletonToContent, pinnedItemHighlight } from '@/lib/animation-variants';
import {
  Plus,
  Search,
  MoreVertical,
  MessageSquare,
  Filter,
  AlertCircle,
  DollarSign,
  X,
  Check,
  Trash2,
  Edit,
  Archive,
  MousePointer2,
  Building2,
} from 'lucide-react';
import { PortalCard } from '@/components/portal/ui/PortalCard';
import { PortalButton } from '@/components/portal/ui/PortalButton';
import { PortalBadge } from '@/components/portal/ui/PortalBadge';
import { SkeletonTable } from '@/components/portal/ui/Skeleton';
import { PortalEmptyState } from '@/components/portal/ui/PortalEmptyState';
import { Dropdown } from '@/components/ui/Dropdown';
import { useRequests } from '@/lib/hooks/useRequests';
import { useAgencyClients } from '@/lib/hooks/useAgencyClients';
import {
  CLIENT_STATUS_MAP,
  ClientStatus,
  Organization,
} from '@/lib/types/portal';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { Link, useRouter } from '@/i18n/navigation';
import { useOrg } from '@/lib/context/OrgContext';
// Centralized utilities - no more duplicate mapStatusColor!
import { getStatusBadgeVariant, getClientStatusBadgeVariant } from '@/lib/utils/portal-helpers';
import { PinButton } from '@/components/portal/PinnedRequests';
import { usePinnedRequests } from '@/lib/hooks/usePinnedRequests';
import { getPortalPath } from '@/lib/utils/portal-paths';

export default function RequestsClient() {
  const orgId = useResolvedOrgId();
  const router = useRouter();
  const { loading: authLoading, isAgency } = usePortalAuth();
  const { requests, loading: requestsLoading, error: requestsError } = useRequests();
  const { pinnedIds } = usePinnedRequests(orgId as string);
  const { switchOrg } = useOrg();
  const prevPinnedIdsRef = useRef<string[]>([]);
  const [newlyPinnedIds, setNewlyPinnedIds] = useState<Set<string>>(new Set());

  // Agency: fetch all organizations to display client names
  const {
    organizations: organizationsList,
  } = useAgencyClients();

  // Build org lookup map for agency users
  const organizations = useMemo(() => {
    if (!organizationsList || !isAgency) return {};
    const map: Record<string, Organization> = {};
    organizationsList.forEach(org => {
      map[org.id] = org;
    });
    return map;
  }, [organizationsList, isAgency]);

  const [isMobile, setIsMobile] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const t = useTranslations();
  const locale = useLocale();

  // Multi-select for pricing offers (agency only)
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Organization filter (agency only)
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');

  const clientFilters: ClientStatus[] = ['SUBMITTED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];
  const filters = isAgency
    ? ['All', 'NEW', 'IN_PROGRESS', 'IN_REVIEW', 'DELIVERED', 'CLOSED']
    : ['All', ...clientFilters];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loading = authLoading || requestsLoading;
  const error = requestsError;

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  // Track newly pinned items for animation
  useEffect(() => {
    const prevPinned = prevPinnedIdsRef.current;

    // Initialize on first render
    if (prevPinned.length === 0 && pinnedIds.length > 0) {
      prevPinnedIdsRef.current = pinnedIds;
      return;
    }

    const newlyPinned = pinnedIds.filter(id => !prevPinned.includes(id));
    const newlyUnpinned = prevPinned.filter(id => !pinnedIds.includes(id));

    if (newlyPinned.length > 0 || newlyUnpinned.length > 0) {
      setNewlyPinnedIds(prev => {
        const updated = new Set(prev);
        newlyPinned.forEach(id => updated.add(id));
        newlyUnpinned.forEach(id => updated.delete(id));
        return updated;
      });

      // Clear the highlight after animation completes
      if (newlyPinned.length > 0) {
        setTimeout(() => {
          setNewlyPinnedIds(prev => {
            const updated = new Set(prev);
            newlyPinned.forEach(id => updated.delete(id));
            return updated;
          });
        }, 1200);
      }
    }

    prevPinnedIdsRef.current = pinnedIds;
  }, [pinnedIds]);

  // Filter and sort requests - pinned items appear at the top
  const filteredRequests = requests
    .filter(req => {
      // Organization filter (agency only)
      if (isAgency && selectedOrgFilter !== 'all' && req.orgId !== selectedOrgFilter) {
        return false;
      }

      let matchesFilter = activeFilter === 'All';
      if (!matchesFilter) {
        if (isAgency) {
          matchesFilter = req.status === activeFilter;
        } else {
          matchesFilter = CLIENT_STATUS_MAP[req.status] === activeFilter;
        }
      }

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (req.title?.toLowerCase() || '').includes(query) ||
        (req.id?.toLowerCase() || '').includes(query) ||
        (req.description?.toLowerCase() || '').includes(query) ||
        (req.type?.toLowerCase() || '').includes(query) ||
        (req.createdByName?.toLowerCase() || '').includes(query) ||
        // Also search org name for agency users
        (isAgency && organizations[req.orgId]?.name?.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      // Sort pinned requests to the top
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0; // Maintain original order within pinned/unpinned groups
    });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  // Multi-select helpers
  const toggleRequestSelection = (requestId: string) => {
    setSelectedRequestIds(prev =>
      prev.includes(requestId) ? prev.filter(id => id !== requestId) : [...prev, requestId]
    );
  };

  const clearSelection = () => {
    setSelectedRequestIds([]);
    setIsSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      clearSelection();
    } else {
      setIsSelectionMode(true);
    }
  };

  // Navigate to dedicated pricing form with selected request IDs
  const handleGoToPricing = () => {
    if (selectedRequestIds.length === 0) return;

    const selectedReqs = requests.filter(r => selectedRequestIds.includes(r.id));
    const uniqueOrgIds = [...new Set(selectedReqs.map(r => r.orgId))];

    if (uniqueOrgIds.length > 1) {
      const orgNames = uniqueOrgIds
        .map(id => organizations[id]?.name || t('portal.common.unknown'))
        .join(', ');
      alert(
        `${t('portal.agency.errors.sameOrgRequired' as any) || 'All selected requests must belong to the same organization.'}\n\n` +
          `Selected requests are from: ${orgNames}`
      );
      return;
    }

    const targetOrgId = uniqueOrgIds[0] || orgId;
    if (!targetOrgId) return;

    // Switch org context if agency and navigate to pricing form
    if (isAgency) {
      switchOrg(targetOrgId);
    }
    router.push(getPortalPath(`/pricing/new?requestIds=${selectedRequestIds.join(',')}`));
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white font-outfit truncate">
            {t('portal.requests.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1 font-medium truncate font-outfit">
            {t('portal.dashboard.subtitle')}
          </p>
        </div>
        <Link href="/portal/requests/new/" className="flex-shrink-0">
          <PortalButton
            variant="primary"
            leftIcon={<Plus size={18} />}
            className="font-outfit whitespace-nowrap"
          >
            {t('portal.requests.newRequest')}
          </PortalButton>
        </Link>
      </div>

      <PortalCard
        variant="glass"
        noPadding
        className="overflow-hidden w-full min-w-0"
      >
        {/* Toolbar */}
        <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex flex-col lg:flex-row lg:items-center gap-4 bg-surface-50/50 dark:bg-surface-900/50 min-w-0">
          <div className="relative w-full lg:w-96 min-w-0 flex-shrink-0">
            <Search
              className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400"
              size={16}
            />
            <input
              type="text"
              placeholder={t('portal.header.searchPlaceholder')}
              className="portal-input ps-10 h-10 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 font-medium w-full min-w-0 font-outfit"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide min-w-0 flex-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-surface-400 uppercase tracking-widest shrink-0">
              <Filter size={12} /> {t('portal.common.filter')}:
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
                  ? t('portal.common.all' as any)
                  : isAgency
                    ? t(`portal.requests.status.${filter.toLowerCase()}` as any)
                    : t(`portal.requests.clientStatus.${filter.toLowerCase()}` as any)}
              </button>
            ))}
            {/* Organization Filter - Agency Only */}
            {isAgency && organizationsList && organizationsList.length > 0 && (
              <div className="shrink-0 flex items-center gap-1.5">
                <Building2 size={14} className="text-surface-400" />
                <select
                  value={selectedOrgFilter}
                  onChange={e => setSelectedOrgFilter(e.target.value)}
                  className="portal-input h-10 px-3 pr-8 text-sm font-bold bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-700 min-w-[140px] max-w-[200px] truncate"
                >
                  <option value="all">{t('portal.common.all')} ({organizationsList.length})</option>
                  {organizationsList.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Selection Mode Toggle - Agency Only */}
            {isAgency && (
              <PortalButton
                variant={isSelectionMode ? "secondary" : "outline"}
                size="sm"
                onClick={toggleSelectionMode}
                className="shrink-0 min-h-[40px] touch-manipulation"
              >
                <MousePointer2 size={16} className="me-1.5" />
                {isSelectionMode ? t('portal.common.cancel') : t('portal.requests.createPricingOffer')}
              </PortalButton>
            )}
          </div>
        </div>

        {/* Selection Bar - Agency Only, shown when in selection mode */}
        {isAgency && isSelectionMode && (
          <div className="p-4 border-b border-surface-100 dark:border-surface-800 bg-blue-50 dark:bg-blue-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {selectedRequestIds.length}
              </div>
              <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
                {selectedRequestIds.length} {t('portal.requests.selected')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PortalButton
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="text-surface-600 dark:text-surface-300 min-h-[40px] touch-manipulation"
              >
                <X size={14} className="me-1" />
                {t('portal.common.cancel')}
              </PortalButton>
              <PortalButton
                size="sm"
                onClick={handleGoToPricing}
                disabled={selectedRequestIds.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white min-h-[40px] touch-manipulation disabled:opacity-50"
              >
                <DollarSign size={14} className="me-1" />
                {t('portal.requests.createPricingOffer')}
              </PortalButton>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto w-full min-w-0">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                exit={{ opacity: 0 }}
                className="p-4"
                role="status"
                aria-live="polite"
              >
                <SkeletonTable rows={8} columns={6} />
                <span className="sr-only">Loading requests...</span>
              </motion.div>
            ) : filteredRequests.length > 0 ? (
              <motion.div
                key="content"
                variants={skeletonToContent}
                initial="hidden"
                animate="visible"
              >
                {/* Mobile Card View */}
                <LayoutGroup>
                  <div className="md:hidden space-y-4 p-4">
                    {paginatedRequests.map(req => {
                      const isNewlyPinned = newlyPinnedIds.has(req.id);
                      const isPinned = pinnedIds.includes(req.id);
                      return (
                        <motion.div
                          layout
                          layoutId={`request-container-${req.id}`}
                          key={req.id}
                          initial="normal"
                          animate={isNewlyPinned ? 'pinned' : 'normal'}
                          variants={pinnedItemHighlight}
                          transition={{
                            layout: {
                              type: 'spring',
                              stiffness: 400,
                              damping: 35,
                              mass: 0.8,
                            },
                          }}
                          onLayoutAnimationStart={() => {
                            if (isNewlyPinned) {
                              // Layout animation started
                            }
                          }}
                          onClick={() => {
                            if (isAgency && req.orgId) {
                              switchOrg(req.orgId);
                            }
                            router.push(getPortalPath(`/requests/${req.id}/`));
                          }}
                          className={cn(
                            "bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-4 shadow-sm active:scale-[0.98] cursor-pointer relative",
                            isNewlyPinned && "border-amber-400 dark:border-amber-500 bg-amber-50/30 dark:bg-amber-500/5 ring-4 ring-amber-400/20 dark:ring-amber-500/20",
                            isPinned && "ring-1 ring-amber-300/30 dark:ring-amber-500/20"
                          )}
                        >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex flex-col min-w-0 me-2">
                          <motion.span
                            layoutId={isMobile ? `request-title-${req.id}` : undefined}
                            className="font-bold text-surface-900 dark:text-white font-outfit truncate text-sm"
                          >
                            {req.title}
                          </motion.span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-[10px] tracking-tight text-surface-500">
                              {req.id.slice(0, 8)}
                            </span>
                            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest truncate">
                              {req.type ? t(`portal.requests.type.${req.type.toLowerCase()}` as any) : t('portal.requests.type.design')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <PinButton requestId={req.id} orgId={orgId as string} size="sm" />
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full mt-1.5',
                              req.priority === 'HIGH' || req.priority === 'URGENT'
                                ? 'bg-rose-500'
                                : req.priority === 'NORMAL'
                                  ? 'bg-amber-500'
                                  : 'bg-blue-500'
                            )}
                          />
                        </div>
                      </div>

                      {req.lastComment && (
                        <div className="bg-surface-50 dark:bg-surface-800/50 rounded-lg p-2.5 mb-3 border border-surface-100 dark:border-surface-800">
                          <div className="flex items-center gap-1.5 mb-1">
                            <MessageSquare size={10} className="text-blue-500" />
                            <span className="text-[10px] font-bold text-surface-700 dark:text-surface-300">
                              {req.lastComment.userName}
                            </span>
                          </div>
                          <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-2">
                            {req.lastComment.content}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800">
                        <motion.div layoutId={isMobile ? `request-status-${req.id}` : undefined}>
                          {isAgency ? (
                            <PortalBadge
                              variant={getStatusBadgeVariant(req.status)}
                              className="text-[10px]"
                            >
                              {t(
                                `portal.requests.status.${req.status?.toLowerCase() || 'new'}` as any
                              )}
                            </PortalBadge>
                          ) : (
                            <PortalBadge
                              variant={getClientStatusBadgeVariant(req.status)}
                              className="text-[10px]"
                            >
                              {t(
                                `portal.requests.clientStatus.${CLIENT_STATUS_MAP[req.status]?.toLowerCase() || 'submitted'}` as any
                              )}
                            </PortalBadge>
                          )}
                        </motion.div>

                        <span className="text-[10px] font-bold text-surface-400 font-outfit">
                          {req.createdAt?.toDate
                            ? format(req.createdAt.toDate(), 'MMM d', {
                                locale: getDateLocale(locale),
                              })
                            : ''}
                        </span>
                      </div>
                    </motion.div>
                      );
                    })}
                  </div>
                </LayoutGroup>

                {/* Desktop Table View */}
                <LayoutGroup>
                  <table className="hidden md:table w-full text-start border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-surface-50/50 dark:bg-surface-900/50 cursor-default">
                        {isAgency && isSelectionMode && (
                          <th className="px-3 py-4 w-12">{/* Selection column */}</th>
                        )}
                        <th className="px-3 md:px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest min-w-[200px]">
                          {t('portal.requests.table.title')}
                        </th>
                        <th className="px-3 md:px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest text-center whitespace-nowrap">
                          {t('portal.requests.table.status')}
                        </th>
                        <th className="px-3 md:px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest text-center whitespace-nowrap">
                          {t('portal.requests.table.priority')}
                        </th>
                        <th className="px-3 md:px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest text-center whitespace-nowrap hidden md:table-cell">
                          {t('portal.requests.table.created')}
                        </th>
                        <th className="px-3 md:px-6 py-4 text-[11px] font-black text-surface-400 uppercase tracking-widest text-end whitespace-nowrap">
                          {t('portal.common.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                      {paginatedRequests.map(req => {
                        const isSelected = selectedRequestIds.includes(req.id);
                        const isNewlyPinned = newlyPinnedIds.has(req.id);
                        const isPinned = pinnedIds.includes(req.id);
                        const canSelect =
                          isAgency &&
                          !req.pricingOfferId &&
                          req.status !== 'PAID' &&
                          req.status !== 'CLOSED';
                        return (
                          <motion.tr
                            layout
                            layoutId={`request-container-${req.id}`}
                            key={req.id}
                            initial="normal"
                            animate={isNewlyPinned ? 'pinned' : 'normal'}
                            variants={pinnedItemHighlight}
                            transition={{
                              layout: {
                                type: 'spring',
                                stiffness: 400,
                                damping: 35,
                                mass: 0.8,
                              },
                            }}
                            onLayoutAnimationStart={() => {
                              if (isNewlyPinned) {
                                // Layout animation started
                              }
                            }}
                            onClick={() => {
                              if (isSelectionMode) return;
                              if (isAgency && req.orgId) {
                                switchOrg(req.orgId);
                              }
                              router.push(getPortalPath(`/requests/${req.id}/`));
                            }}
                            className={cn(
                              'hover:bg-surface-50/50 dark:hover:bg-surface-800/30 group cursor-pointer relative',
                              isSelected && 'bg-blue-50 dark:bg-blue-900/10',
                              isNewlyPinned && 'border-s-4 border-amber-400 dark:border-amber-500 bg-amber-50/30 dark:bg-amber-500/5 ring-4 ring-amber-400/20 dark:ring-amber-500/20',
                              isPinned && 'ring-1 ring-amber-300/30 dark:ring-amber-500/20'
                            )}
                          >
                          {/* Checkbox column - only visible in selection mode */}
                          {isAgency && isSelectionMode && (
                            <td className="px-3 py-4">
                              {canSelect ? (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    toggleRequestSelection(req.id);
                                  }}
                                  className={cn(
                                    'w-5 h-5 rounded flex items-center justify-center transition-all border-2',
                                    isSelected
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'border-surface-300 dark:border-surface-600 hover:border-blue-400'
                                  )}
                                >
                                  {isSelected && <Check size={12} />}
                                </button>
                              ) : req.pricingOfferId ? (
                                <PortalBadge variant="green" className="text-[9px]">
                                  {t('portal.requests.hasPricing')}
                                </PortalBadge>
                              ) : null}
                            </td>
                          )}
                          <td className="px-3 md:px-6 py-4 min-w-0">
                            <div className="flex flex-col min-w-0">
                              {/* Organization name for agency users */}
                              {isAgency && req.orgId && (
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider truncate mb-0.5">
                                  {organizations[req.orgId]?.name || t('portal.common.unknown')}
                                </span>
                              )}
                              <motion.span
                                layoutId={!isMobile ? `request-title-${req.id}` : undefined}
                                className="font-bold text-surface-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate font-outfit"
                              >
                                {req.title}
                              </motion.span>
                              {req.lastComment && (
                                <span className="text-xs text-surface-500 dark:text-surface-400 font-medium truncate mt-0.5 max-w-full flex items-center gap-1 pe-4">
                                  <span className="font-bold text-surface-700 dark:text-surface-300 shrink-0">
                                    {req.lastComment.userName}:
                                  </span>
                                  <span className="truncate">{req.lastComment.content}</span>
                                </span>
                              )}
                              <span className="text-xs font-bold text-surface-400 flex items-center gap-1.5 mt-1 font-outfit flex-wrap">
                                {t('portal.requests.table.id')}:{' '}
                                <span className="font-mono bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-[10px] tracking-tight shrink-0">
                                  {req.id.slice(0, 8)}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-surface-300 shrink-0" />
                                <span className="uppercase tracking-wider text-[10px] truncate">
                                  {req.type ? t(`portal.requests.type.${req.type.toLowerCase()}` as any) : t('portal.requests.type.design')}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4">
                            <div className="flex justify-center">
                              <motion.div
                                layoutId={!isMobile ? `request-status-${req.id}` : undefined}
                              >
                                {isAgency ? (
                                  <PortalBadge variant={getStatusBadgeVariant(req.status)}>
                                    {t(
                                      `portal.requests.status.${req.status?.toLowerCase() || 'new'}` as any
                                    )}
                                  </PortalBadge>
                                ) : (
                                  <PortalBadge variant={getClientStatusBadgeVariant(req.status)}>
                                    {t(
                                      `portal.requests.clientStatus.${CLIENT_STATUS_MAP[req.status]?.toLowerCase() || 'submitted'}` as any
                                    )}
                                  </PortalBadge>
                                )}
                              </motion.div>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <div
                                className={cn(
                                  'w-2 h-2 rounded-full shrink-0',
                                  req.priority === 'HIGH' || req.priority === 'URGENT'
                                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                                    : req.priority === 'NORMAL'
                                      ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                                      : 'bg-blue-500 shadow-sm shadow-blue-500/50'
                                )}
                              />
                              <span className="text-sm font-bold text-surface-600 dark:text-surface-300 font-outfit whitespace-nowrap">
                                {t(
                                  `portal.requests.priority.${req.priority?.toLowerCase() || 'normal'}` as any
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4 hidden md:table-cell">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-bold text-surface-800 dark:text-surface-200 font-outfit whitespace-nowrap">
                                {req.createdAt?.toDate
                                  ? format(req.createdAt.toDate(), 'MMM d, yyyy', {
                                      locale: getDateLocale(locale),
                                    })
                                  : t('portal.common.recently')}
                              </span>
                              <span className="text-[10px] font-black text-surface-400 uppercase tracking-tighter">
                                {t('portal.requests.table.created')}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4 text-end">
                            <div className="flex items-center justify-end gap-1">
                              <PinButton requestId={req.id} orgId={orgId as string} />
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  router.push(getPortalPath(`/requests/${req.id}/`));
                                }}
                                className="p-2 text-surface-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              >
                                <MessageSquare size={16} />
                              </button>
                              <Dropdown
                                trigger={
                                  <span className="p-2 text-surface-400 hover:text-surface-900 dark:hover:text-white transition-all rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 inline-flex">
                                    <MoreVertical size={16} />
                                  </span>
                                }
                                items={[
                                  {
                                    label: t('portal.common.edit'),
                                    onClick: () => console.log('Edit request', req.id),
                                    icon: <Edit size={16} />,
                                  },
                                  {
                                    label: t('portal.common.archive'),
                                    onClick: () => console.log('Archive request', req.id),
                                    icon: <Archive size={16} />,
                                  },
                                  {
                                    label: t('portal.common.delete'),
                                    onClick: () => {
                                      if (confirm(t('portal.common.deleteConfirm'))) {
                                        console.log('Delete request', req.id);
                                      }
                                    },
                                    icon: <Trash2 size={16} />,
                                    variant: 'danger',
                                  },
                                ]}
                              />
                            </div>
                          </td>
                        </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </LayoutGroup>
              </motion.div>
            ) : (
              <PortalEmptyState
                icon={Search}
                title={t('portal.requests.emptyTitle')}
                description={
                  searchQuery || activeFilter !== 'All'
                    ? t('portal.requests.emptySearch')
                    : t('portal.requests.emptyDescription')
                }
                action={
                  !searchQuery && activeFilter === 'All' ? (
                    <Link href="/portal/requests/new/">
                      <PortalButton className="h-11 px-8 font-outfit shadow-lg shadow-blue-500/20">
                        <Plus size={18} className="me-2" />
                        {t('portal.requests.newRequest')}
                      </PortalButton>
                    </Link>
                  ) : undefined
                }
                className="py-20"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        {!loading && filteredRequests.length > 0 && (
          <div className="p-5 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-50/30 dark:bg-surface-900/30 min-w-0">
            <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest truncate min-w-0">
              {t('portal.common.showing', {
                count: paginatedRequests.length,
                total: filteredRequests.length,
              })}
            </span>
            <div className="flex items-center gap-2 shrink-0">
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
    </div>
  );
}
