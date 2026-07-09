'use client';

import { Fragment, useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dropdown } from '@/components/ui/Dropdown';
import { useRequests } from '@/lib/hooks/useRequests';
import { useAgencyClients } from '@/lib/hooks/useAgencyClients';
import { CLIENT_STATUS_MAP, ClientStatus, Organization } from '@/lib/types/portal';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { Link, useRouter } from '@/i18n/navigation';
import { useOrg } from '@/lib/context/OrgContext';
import { useOpenRequest } from '@/lib/hooks/useOpenRequest';
// Centralized utilities - no more duplicate mapStatusColor!
import { getStatusBadgeVariant, getClientStatusBadgeVariant } from '@/lib/utils/portal-helpers';
import { PinButton } from '@/components/portal/PinnedRequests';
import { usePinnedRequests } from '@/lib/hooks/usePinnedRequests';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { activateOnKeyboard } from '@/lib/utils/portal-interactive';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useRequestListMutations } from '@/lib/hooks/useRequestListMutations';
import { toast } from 'sonner';
import { Request } from '@/lib/types/portal'; // Explicit import to avoid DOM Request conflict
import { EditRequestModal } from '@/components/portal/requests/EditRequestModal';
import { PortalPageHeader } from '@/components/portal/ui/PortalPageHeader';
import { PortalSearchField } from '@/components/portal/ui/PortalSearchField';
import { Select } from '@/components/ui/Select';
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
import {
  getStatusTranslationKey,
  getClientStatusTranslationKey,
  getPriorityTranslationKey,
} from '@/lib/i18n/portal-translation-keys';

const MotionPortalTableRow = motion(PortalTableRow);

export default function RequestsClient() {
  const orgId = useResolvedOrgId();
  const router = useRouter();
  const t = useTranslations('portal');
  const { loading: auth, isAgency } = usePortalAuth();
  const safeOrgId = typeof orgId === 'string' ? orgId : undefined;
  const {
    deleteRequest,
    updateStatus,
    isDeleting: isDeletingRequest,
  } = useRequestListMutations(safeOrgId);

  // Edit & Archive logic
  const [requestToEdit, setRequestToEdit] = useState<Request | null>(null);

  const handleArchiveClick = async (req: Request) => {
    try {
      await updateStatus({ requestId: req.id, status: 'CLOSED' });
      toast.success(t('requests.toast.statusUpdated'));
    } catch (e) {
      console.error(e);
    }
  };
  const { requests, loading: _requests, error: requestsError } = useRequests();
  const { pinnedIds } = usePinnedRequests(orgId as string);
  const { switchOrg } = useOrg();
  const { openRequest: openRequestPreview } = useOpenRequest();
  const prevPinnedIdsRef = useRef<string[]>([]);
  const [newlyPinnedIds, setNewlyPinnedIds] = useState<Set<string>>(new Set());

  // Agency: fetch all organizations to display client names
  const { organizations: organizationsList } = useAgencyClients();

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

  // Search state with debounce
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [expandedBundleIds, setExpandedBundleIds] = useState<Set<string>>(new Set());
  const itemsPerPage = 8;
  const locale = useLocale();

  // Multi-select for pricing offers (agency only)
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Organization filter (agency only)
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isDeletingCombined = isDeleting || isDeletingRequest;

  const clientFilters: ClientStatus[] = ['SUBMITTED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'];
  const filters = isAgency
    ? [
        'All',
        'DRAFT',
        'NEW',
        'QUOTED',
        'CHANGES_REQUESTED',
        'ACCEPTED',
        'IN_PROGRESS',
        'IN_REVIEW',
        'DELIVERED',
        'PAID',
        'CLOSED',
      ]
    : ['All', ...clientFilters];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loading = auth || _requests;
  const error = requestsError;

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, debouncedSearchQuery]);

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

  // Handle Delete
  const handleDeleteClick = (requestId: string) => {
    setRequestToDelete(requestId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;

    const deleted = requests.find(r => r.id === requestToDelete);

    setIsDeleting(true);
    try {
      await deleteRequest({
        requestId: requestToDelete,
        orgId: deleted?.orgId ?? safeOrgId,
      });
      setDeleteModalOpen(false);
      setRequestToDelete(null);
    } catch (error) {
      console.error('Failed to delete request:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and sort requests - pinned items appear at the top
  const filteredRequests = requests
    .filter(req => {
      // Bundle items are rendered beneath their parent instead of as duplicate top-level rows.
      if (
        req.requestRole === 'bundle_item' &&
        req.parentRequestId &&
        requests.some(parent => parent.id === req.parentRequestId)
      ) {
        return false;
      }
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

      const query = debouncedSearchQuery.trim().toLowerCase();
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

  const requestsById = useMemo(
    () => new Map(requests.map(request => [request.id, request])),
    [requests]
  );

  const getBundleChildren = (request: Request) =>
    (request.childRequestIds || [])
      .map(id => requestsById.get(id))
      .filter((child): child is Request => Boolean(child));

  const toggleBundle = (requestId: string) => {
    setExpandedBundleIds(current => {
      const next = new Set(current);
      if (next.has(requestId)) next.delete(requestId);
      else next.add(requestId);
      return next;
    });
  };

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const openRequest = (req: Request) => {
    if (isSelectionMode) return;
    openRequestPreview(req.id, { orgId: req.orgId });
  };

  // Navigate to dedicated pricing form with selected request IDs
  const handleGoToPricing = () => {
    if (selectedRequestIds.length === 0) return;

    const selectedReqs = requests.filter(r => selectedRequestIds.includes(r.id));
    const uniqueOrgIds = [...new Set(selectedReqs.map(r => r.orgId))];

    if (uniqueOrgIds.length > 1) {
      const orgNames = uniqueOrgIds
        .map(id => organizations[id]?.name || t('common.unknown'))
        .join(', ');
      toast.warning(
        `${t('agency.errors.sameOrgRequired')} Selected requests are from: ${orgNames}`
      );
      return;
    }

    const targetOrgId = uniqueOrgIds[0] || orgId;
    if (!targetOrgId) return;

    // Switch org context if agency and navigate to pricing form
    if (isAgency) {
      switchOrg(targetOrgId);
    }
    router.push(
      getPortalPath(`/requests/new?mode=quote&requestIds=${selectedRequestIds.join(',')}`)
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-surface-200 dark:bg-surface-800 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-surface-100 dark:bg-surface-850 rounded-md animate-pulse" />
          </div>
          <div className="h-11 w-32 bg-surface-200 dark:bg-surface-800 rounded-xl animate-pulse" />
        </div>
        <SkeletonTable />
      </div>
    );
  }

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

  // Edit & Archive logic

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full min-w-0">
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={t('common.deleteConfirmTitle') || 'Delete Request?'}
        description={
          t('common.deleteConfirm') ||
          'Are you sure you want to delete this request? This action cannot be undone.'
        }
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeletingCombined}
      />

      {/* Edit Modal */}
      {requestToEdit && (
        <EditRequestModal
          isOpen={!!requestToEdit}
          onClose={() => setRequestToEdit(null)}
          request={requestToEdit}
          orgId={requestToEdit.orgId}
        />
      )}

      {/* ... rest of the UI ... */}
      <PortalPageHeader
        title={t('requests.title')}
        description={t('dashboard.subtitle')}
        className="mb-0"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isAgency && (
              <Link
                href={getPortalPath('/requests/new?mode=quote')}
                className="portal-focus-ring flex-shrink-0 rounded-xl"
              >
                <Button
                  as="div"
                  variant="outline"
                  leftIcon={<DollarSign size={18} />}
                  className="font-outfit whitespace-nowrap"
                >
                  {t('requests.createPricingOffer')}
                </Button>
              </Link>
            )}
            <Link
              href={getPortalPath('/requests/new/')}
              className="portal-focus-ring flex-shrink-0 rounded-xl"
            >
              <Button
                as="div"
                variant="primary"
                leftIcon={<Plus size={18} />}
                className="font-outfit whitespace-nowrap"
              >
                {t('requests.newRequest')}
              </Button>
            </Link>
          </div>
        }
      />

      <Card variant="glass" noPadding className="overflow-hidden w-full min-w-0">
        {/* Toolbar */}
        <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex flex-col lg:flex-row lg:items-center gap-4 bg-surface-50/50 dark:bg-surface-900/50 min-w-0">
          {/* ... Existing toolbar content ... */}
          <PortalSearchField
            className="w-full lg:w-96 min-w-0 flex-shrink-0"
            placeholder={t('header.searchPlaceholder')}
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide min-w-0 flex-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 portal-label-sm shrink-0">
              <Filter size={12} /> {t('common.filter')}:
            </div>
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  'portal-focus-ring px-3 py-2.5 min-h-[40px] text-sm font-bold rounded-lg whitespace-nowrap transition-all font-outfit shrink-0 touch-manipulation active:scale-95',
                  activeFilter === filter
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                    : 'text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-800'
                )}
                aria-pressed={activeFilter === filter}
              >
                {filter === 'All'
                  ? t('common.all')
                  : isAgency
                    ? t(getStatusTranslationKey(filter))
                    : t(getClientStatusTranslationKey(filter, false))}
              </button>
            ))}
            {/* Organization Filter - Agency Only */}
            {isAgency && organizationsList && organizationsList.length > 0 && (
              <div className="shrink-0 flex items-center gap-1.5">
                <Building2 size={14} className="text-surface-400" />
                <Select
                  value={selectedOrgFilter}
                  onChange={e => setSelectedOrgFilter(e.target.value)}
                  aria-label={t('accessibility.switchOrganization')}
                  className="min-w-[140px] max-w-[200px] truncate text-sm font-bold"
                  options={[
                    {
                      value: 'all',
                      label: `${t('common.all')} (${organizationsList.length})`,
                    },
                    ...organizationsList.map(org => ({
                      value: org.id,
                      label: org.name,
                    })),
                  ]}
                />
              </div>
            )}
            {/* Selection Mode Toggle - Agency Only */}
            {isAgency && (
              <Button
                variant={isSelectionMode ? 'secondary' : 'outline'}
                size="sm"
                onClick={toggleSelectionMode}
                className="shrink-0 min-h-[40px] touch-manipulation"
              >
                <MousePointer2 size={16} className="me-1.5" />
                {isSelectionMode ? t('common.cancel') : t('requests.createPricingOffer')}
              </Button>
            )}
          </div>
        </div>

        {/* Selection Bar - Agency Only, shown when in selection mode */}
        {isAgency && isSelectionMode && (
          <div className="p-4 border-b border-surface-100 dark:border-surface-800 bg-primary-50 dark:bg-primary-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {selectedRequestIds.length}
              </div>
              <span className="text-sm font-bold text-primary-800 dark:text-primary-200">
                {selectedRequestIds.length}{' '}
                {selectedRequestIds.length === 1
                  ? t('requests.selected_singular')
                  : t('requests.selected')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="text-surface-600 dark:text-surface-300 min-h-[40px] touch-manipulation"
              >
                <X size={14} className="me-1" />
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleGoToPricing}
                disabled={selectedRequestIds.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white min-h-[40px] touch-manipulation disabled:opacity-50"
              >
                <DollarSign size={14} className="me-1" />
                {t('requests.createPricingOffer')}
              </Button>
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
                <span className="sr-only"> requests...</span>
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
                          role="link"
                          tabIndex={isSelectionMode ? -1 : 0}
                          onClick={() => openRequest(req)}
                          onKeyDown={e => activateOnKeyboard(e, () => openRequest(req))}
                          className={cn(
                            'portal-focus-ring bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl p-4 shadow-sm active:scale-[0.98] cursor-pointer relative outline-none',
                            isNewlyPinned &&
                              'border-amber-400 dark:border-amber-500 bg-amber-50/30 dark:bg-amber-500/5 ring-4 ring-amber-400/20 dark:ring-amber-500/20',
                            isPinned && 'ring-1 ring-amber-300/30 dark:ring-amber-500/20'
                          )}
                        >
                          {/* ... Mobile card content ... */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex flex-col min-w-0 me-2">
                              {/* ... */}
                              <motion.span
                                layoutId={isMobile ? `request-title-${req.id}` : undefined}
                                className="font-bold text-surface-900 dark:text-white font-outfit truncate text-sm"
                              >
                                {req.title}
                              </motion.span>
                              {/* ... */}
                            </div>
                            {/* ... */}
                          </div>
                          {getBundleChildren(req).length > 0 && (
                            <div className="mt-3 border-t border-surface-200 pt-3 dark:border-surface-800">
                              <button
                                type="button"
                                className="portal-focus-ring flex min-h-[44px] w-full items-center justify-between rounded-lg px-2 text-start text-xs font-bold text-surface-600 dark:text-surface-300"
                                aria-expanded={expandedBundleIds.has(req.id)}
                                onClick={event => {
                                  event.stopPropagation();
                                  toggleBundle(req.id);
                                }}
                              >
                                {t('requests.bundleItems', {
                                  count: getBundleChildren(req).length,
                                })}
                                <ChevronDown
                                  size={16}
                                  className={cn(
                                    'transition-transform',
                                    expandedBundleIds.has(req.id) && 'rotate-180'
                                  )}
                                />
                              </button>
                              {expandedBundleIds.has(req.id) && (
                                <div className="mt-1 space-y-1 ps-2">
                                  {getBundleChildren(req).map(child => (
                                    <button
                                      key={child.id}
                                      type="button"
                                      className="portal-focus-ring flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 text-start hover:bg-surface-100 dark:hover:bg-surface-800"
                                      onClick={event => {
                                        event.stopPropagation();
                                        openRequest(child);
                                      }}
                                    >
                                      <span className="truncate text-xs font-bold">
                                        {child.title}
                                      </span>
                                      <Badge variant={getStatusBadgeVariant(child.status)}>
                                        {t(getStatusTranslationKey(child.status))}
                                      </Badge>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </LayoutGroup>

                {/* Desktop Table View */}
                <LayoutGroup>
                  <div className="hidden md:block">
                    <PortalTable className="border-0 shadow-none bg-transparent rounded-none overflow-visible">
                      <PortalTableScroll>
                        <PortalTableElement className="min-w-[600px]">
                          <PortalTableHeader className="bg-surface-50/50 dark:bg-surface-900/50">
                            <PortalTableRow className="cursor-default">
                              {isAgency && isSelectionMode && (
                                <PortalTableHead headStyle="label" className="px-3 w-12" />
                              )}
                              <PortalTableHead
                                headStyle="label"
                                className="px-3 md:px-6 min-w-[200px]"
                              >
                                {t('requests.table.title')}
                              </PortalTableHead>
                              <PortalTableHead
                                headStyle="label"
                                cellAlign="center"
                                className="px-3 md:px-6 whitespace-nowrap"
                              >
                                {t('requests.table.status')}
                              </PortalTableHead>
                              <PortalTableHead
                                headStyle="label"
                                cellAlign="center"
                                className="px-3 md:px-6 whitespace-nowrap"
                              >
                                {t('requests.table.priority')}
                              </PortalTableHead>
                              <PortalTableHead
                                headStyle="label"
                                cellAlign="center"
                                className="px-3 md:px-6 whitespace-nowrap hidden md:table-cell"
                              >
                                {t('requests.table.created')}
                              </PortalTableHead>
                              <PortalTableHead
                                headStyle="label"
                                cellAlign="end"
                                className="px-3 md:px-6 whitespace-nowrap"
                              >
                                {t('common.actions')}
                              </PortalTableHead>
                            </PortalTableRow>
                          </PortalTableHeader>
                          <PortalTableBody>
                            {paginatedRequests.map(req => {
                              const isSelected = selectedRequestIds.includes(req.id);
                              const isNewlyPinned = newlyPinnedIds.has(req.id);
                              const isPinned = pinnedIds.includes(req.id);
                              const canSelect =
                                isAgency &&
                                req.requestRole !== 'bundle' &&
                                !req.parentRequestId &&
                                req.status !== 'PAID' &&
                                req.status !== 'CLOSED';
                              const bundleChildren = getBundleChildren(req);
                              return (
                                <Fragment key={req.id}>
                                  <MotionPortalTableRow
                                    layout
                                    layoutId={`request-container-${req.id}`}
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
                                    role="link"
                                    tabIndex={isSelectionMode ? -1 : 0}
                                    onClick={() => openRequest(req)}
                                    onKeyDown={e => activateOnKeyboard(e, () => openRequest(req))}
                                    hover
                                    className={cn(
                                      'portal-focus-ring group cursor-pointer relative outline-none',
                                      isSelected && 'bg-primary-50 dark:bg-primary-900/10',
                                      isNewlyPinned &&
                                        'bg-amber-50/40 dark:bg-amber-500/10 ring-2 ring-amber-400/40 dark:ring-amber-500/30',
                                      isPinned && 'ring-1 ring-amber-300/30 dark:ring-amber-500/20'
                                    )}
                                  >
                                    {isAgency && isSelectionMode && (
                                      <PortalTableCell className="px-3 py-4">
                                        {canSelect ? (
                                          <button
                                            type="button"
                                            onClick={e => {
                                              e.stopPropagation();
                                              toggleRequestSelection(req.id);
                                            }}
                                            aria-pressed={isSelected}
                                            aria-label={`${t('common.select')}: ${req.title}`}
                                            className={cn(
                                              'portal-focus-ring w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors touch-manipulation',
                                              isSelected
                                                ? 'bg-primary-600 border-primary-600 text-white'
                                                : 'border-surface-300 dark:border-surface-600 hover:border-primary-400'
                                            )}
                                          >
                                            {isSelected && <Check size={12} />}
                                          </button>
                                        ) : req.parentRequestId ? (
                                          <Badge variant="green" className="text-[9px]">
                                            {t('requests.hasPricing')}
                                          </Badge>
                                        ) : null}
                                      </PortalTableCell>
                                    )}

                                    <PortalTableCell className="px-3 md:px-6 min-w-0">
                                      <div className="flex flex-col min-w-0">
                                        {isAgency && req.orgId && (
                                          <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider truncate mb-0.5">
                                            {organizations[req.orgId]?.name || t('common.unknown')}
                                          </span>
                                        )}
                                        <motion.span
                                          layoutId={
                                            !isMobile ? `request-title-${req.id}` : undefined
                                          }
                                          className="font-bold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate font-outfit"
                                        >
                                          {req.title}
                                        </motion.span>
                                        <span className="text-xs font-bold text-surface-400 flex items-center gap-1.5 mt-1 font-outfit flex-wrap">
                                          {/* ... */}
                                        </span>
                                      </div>
                                    </PortalTableCell>

                                    <PortalTableCell cellAlign="center" className="px-3 md:px-6">
                                      <div className="flex justify-center">
                                        <motion.div>
                                          {isAgency ? (
                                            <Badge variant={getStatusBadgeVariant(req.status)}>
                                              {t(getStatusTranslationKey(req.status))}
                                            </Badge>
                                          ) : (
                                            <Badge
                                              variant={getClientStatusBadgeVariant(req.status)}
                                            >
                                              {t(getClientStatusTranslationKey(req.status, true))}
                                            </Badge>
                                          )}
                                        </motion.div>
                                        {req.isFree && (
                                          <Badge variant="green" className="ms-2">
                                            {t('common.free')}
                                          </Badge>
                                        )}
                                      </div>
                                    </PortalTableCell>

                                    <PortalTableCell cellAlign="center" className="px-3 md:px-6">
                                      <div className="flex items-center justify-center gap-2">
                                        <div
                                          className={cn(
                                            'w-2 h-2 rounded-full shrink-0',
                                            req.priority === 'HIGH' || req.priority === 'URGENT'
                                              ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                                              : req.priority === 'NORMAL'
                                                ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                                                : 'bg-primary-500 shadow-sm shadow-primary-500/50'
                                          )}
                                        />
                                        <span className="text-sm font-bold text-surface-600 dark:text-surface-300 font-outfit whitespace-nowrap">
                                          {t(getPriorityTranslationKey(req.priority))}
                                        </span>
                                      </div>
                                    </PortalTableCell>

                                    <PortalTableCell
                                      cellAlign="center"
                                      className="px-3 md:px-6 hidden md:table-cell"
                                    >
                                      <div className="flex flex-col items-center">
                                        <span className="text-sm font-bold text-surface-800 dark:text-surface-200 font-outfit whitespace-nowrap">
                                          {req.createdAt?.toDate
                                            ? format(req.createdAt.toDate(), 'MMM d, yyyy', {
                                                locale: getDateLocale(locale),
                                              })
                                            : t('common.recently')}
                                        </span>
                                        <span className="text-[10px] font-black text-surface-400 uppercase tracking-tighter">
                                          {t('requests.table.created')}
                                        </span>
                                      </div>
                                    </PortalTableCell>

                                    <PortalTableCell cellAlign="end" className="px-3 md:px-6">
                                      <div className="flex items-center justify-end gap-1">
                                        <PinButton requestId={req.id} orgId={orgId as string} />
                                        <IconButton
                                          icon={MessageSquare}
                                          label={req.title}
                                          variant="ghost"
                                          size="sm"
                                          iconSize={16}
                                          className="min-w-[44px] min-h-[44px] hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                          onClick={e => {
                                            e.stopPropagation();
                                            openRequest(req);
                                          }}
                                        />
                                        <Dropdown
                                          trigger={
                                            <IconButton
                                              icon={MoreVertical}
                                              label={t('common.actions')}
                                              variant="ghost"
                                              size="sm"
                                              iconSize={16}
                                              className="min-w-[44px] min-h-[44px]"
                                              onClick={e => e.stopPropagation()}
                                            />
                                          }
                                          items={[
                                            {
                                              label: t('common.edit'),
                                              onClick: () => setRequestToEdit(req),
                                              icon: <Edit size={16} />,
                                            },
                                            {
                                              label: t('common.archive'),
                                              onClick: () => handleArchiveClick(req),
                                              icon: <Archive size={16} />,
                                            },
                                            {
                                              label: t('common.delete'),
                                              onClick: () => handleDeleteClick(req.id),
                                              icon: <Trash2 size={16} />,
                                              variant: 'danger',
                                            },
                                          ]}
                                        />
                                      </div>
                                    </PortalTableCell>
                                  </MotionPortalTableRow>
                                  {bundleChildren.length > 0 && (
                                    <PortalTableRow className="bg-surface-50/70 dark:bg-surface-900/40">
                                      <PortalTableCell
                                        colSpan={isAgency && isSelectionMode ? 6 : 5}
                                        className="px-6 py-2"
                                      >
                                        <button
                                          type="button"
                                          className="portal-focus-ring flex min-h-[40px] w-full items-center gap-2 rounded-lg text-start text-xs font-bold text-surface-600 dark:text-surface-300"
                                          aria-expanded={expandedBundleIds.has(req.id)}
                                          onClick={() => toggleBundle(req.id)}
                                        >
                                          <ChevronDown
                                            size={15}
                                            className={cn(
                                              'transition-transform',
                                              expandedBundleIds.has(req.id) && 'rotate-180'
                                            )}
                                          />
                                          {t('requests.bundleItems', {
                                            count: bundleChildren.length,
                                          })}
                                        </button>
                                        {expandedBundleIds.has(req.id) && (
                                          <div className="grid gap-1 pb-2 ps-6">
                                            {bundleChildren.map(child => (
                                              <button
                                                key={child.id}
                                                type="button"
                                                className="portal-focus-ring flex min-h-[40px] items-center justify-between rounded-lg px-3 text-start hover:bg-white dark:hover:bg-surface-800"
                                                onClick={() => openRequest(child)}
                                              >
                                                <span className="truncate text-sm font-bold">
                                                  {child.title}
                                                </span>
                                                <Badge
                                                  variant={getStatusBadgeVariant(child.status)}
                                                >
                                                  {t(getStatusTranslationKey(child.status))}
                                                </Badge>
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </PortalTableCell>
                                    </PortalTableRow>
                                  )}
                                </Fragment>
                              );
                            })}
                          </PortalTableBody>
                        </PortalTableElement>
                      </PortalTableScroll>
                    </PortalTable>
                  </div>
                </LayoutGroup>
              </motion.div>
            ) : (
              <EmptyState
                icon={Search}
                title={t('requests.emptyTitle')}
                description={
                  debouncedSearchQuery || activeFilter !== 'All'
                    ? t('requests.emptySearch')
                    : t('requests.emptyDescription')
                }
                action={
                  !debouncedSearchQuery && activeFilter === 'All' ? (
                    <Link href={getPortalPath('/requests/new/')}>
                      <Button
                        as="div"
                        className="h-11 px-8 font-outfit shadow-lg shadow-primary-500/20"
                      >
                        <Plus size={18} className="me-2" />
                        {t('requests.newRequest')}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setActiveFilter('All');
                      }}
                    >
                      {t('common.clearFilters')}
                    </Button>
                  )
                }
                className="py-20"
              />
            )}
          </AnimatePresence>
        </div>
        {/* Footer info ... */}
      </Card>
    </div>
  );
}
