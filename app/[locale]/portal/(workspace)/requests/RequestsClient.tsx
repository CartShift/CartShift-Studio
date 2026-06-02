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
// Centralized utilities - no more duplicate mapStatusColor!
import { getStatusBadgeVariant, getClientStatusBadgeVariant } from '@/lib/utils/portal-helpers';
import { PinButton } from '@/components/portal/PinnedRequests';
import { usePinnedRequests } from '@/lib/hooks/usePinnedRequests';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { activateOnKeyboard } from '@/lib/utils/portal-interactive';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { deleteRequest, updateRequestStatus } from '@/lib/services/portal-requests';
import { useQueryClient } from '@tanstack/react-query';
import { invalidatePortalRequestData } from '@/lib/utils/portal-cache-invalidation';
import { toast } from 'sonner';
import { Request } from '@/lib/types/portal'; // Explicit import to avoid DOM Request conflict
import { EditRequestModal } from '@/components/portal/requests/EditRequestModal';

const getStatusTranslationKey = (status: string | undefined): string => {
  const statusMap: Record<string, string> = {
    new: 'requests.status.new',
    needs_info: 'requests.status.needs_info',
    quoted: 'requests.status.quoted',
    accepted: 'requests.status.accepted',
    declined: 'requests.status.declined',
    queued: 'requests.status.queued',
    in_progress: 'requests.status.in_progress',
    in_review: 'requests.status.in_review',
    delivered: 'requests.status.delivered',
    paid: 'requests.status.paid',
    closed: 'requests.status.closed',
    canceled: 'requests.status.canceled',
  };
  return statusMap[status?.toLowerCase() || 'new'] || 'requests.status.new';
};

const getClientStatusTranslationKey = (
  status: string | undefined,
  isAgencyStatus: boolean = false
): string => {
  const statusMap: Record<string, string> = {
    submitted: 'requests.clientStatus.submitted',
    in_progress: 'requests.clientStatus.in_progress',
    in_review: 'requests.clientStatus.in_review',
    completed: 'requests.clientStatus.completed',
  };
  if (isAgencyStatus) {
    const mappedStatus = CLIENT_STATUS_MAP[status as keyof typeof CLIENT_STATUS_MAP];
    return (
      statusMap[mappedStatus?.toLowerCase() || 'submitted'] || 'requests.clientStatus.submitted'
    );
  }
  return statusMap[status?.toLowerCase() || 'submitted'] || 'requests.clientStatus.submitted';
};

const getPriorityTranslationKey = (priority: string | undefined): string => {
  const priorityMap: Record<string, string> = {
    low: 'requests.priority.low',
    normal: 'requests.priority.normal',
    high: 'requests.priority.high',
    urgent: 'requests.priority.urgent',
  };
  return priorityMap[priority?.toLowerCase() || 'normal'] || 'requests.priority.normal';
};

export default function RequestsClient() {
  const orgId = useResolvedOrgId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('portal');
  const { loading: auth, isAgency } = usePortalAuth();
  const safeOrgId = typeof orgId === 'string' ? orgId : undefined;

  // Edit & Archive logic
  const [requestToEdit, setRequestToEdit] = useState<Request | null>(null);

  const handleArchiveClick = async (req: Request) => {
    // "Archive" means CLOSED in this context
    try {
      await updateRequestStatus(req.id, 'CLOSED');
      invalidatePortalRequestData(queryClient, { orgId: req.orgId ?? safeOrgId, requestId: req.id });
      toast.success(t('requests.toast.statusUpdated'));
    } catch (e) {
      console.error(e);
      toast.error(t('common.error'));
    }
  };
  const { requests, loading: _requests, error: requestsError } = useRequests();
  const { pinnedIds } = usePinnedRequests(orgId as string);
  const { switchOrg } = useOrg();
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
      await deleteRequest(requestToDelete);
      invalidatePortalRequestData(queryClient, {
        orgId: deleted?.orgId ?? safeOrgId,
        requestId: requestToDelete,
      });
      toast.success(t('common.deleteSuccess'));
      setDeleteModalOpen(false);
      setRequestToDelete(null);
    } catch (error) {
      console.error('Failed to delete request:', error);
      toast.error(t('common.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

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
    if (isAgency && req.orgId) {
      switchOrg(req.orgId);
    }
    router.push(getPortalPath(`/requests/${req.id}/`));
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
    router.push(getPortalPath(`/pricing/new?requestIds=${selectedRequestIds.join(',')}`));
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
        isLoading={isDeleting}
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white font-outfit truncate">
            {t('requests.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1 font-medium truncate font-outfit">
            {t('dashboard.subtitle')}
          </p>
        </div>
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

      <Card variant="glass" noPadding className="overflow-hidden w-full min-w-0">
        {/* Toolbar */}
        <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex flex-col lg:flex-row lg:items-center gap-4 bg-surface-50/50 dark:bg-surface-900/50 min-w-0">
          {/* ... Existing toolbar content ... */}
          <div className="relative w-full lg:w-96 min-w-0 flex-shrink-0">
            <Search
              className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400"
              size={16}
            />
            <input
              type="text"
              placeholder={t('header.searchPlaceholder')}
              className="portal-input ps-10 h-10 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 font-medium w-full min-w-0 font-outfit"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
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
                    ? t(getStatusTranslationKey(filter) as any)
                    : t(getClientStatusTranslationKey(filter, false) as any)}
              </button>
            ))}
            {/* Organization Filter - Agency Only */}
            {isAgency && organizationsList && organizationsList.length > 0 && (
              <div className="shrink-0 flex items-center gap-1.5">
                <Building2 size={14} className="text-surface-400" />
                <select
                  value={selectedOrgFilter}
                  onChange={e => setSelectedOrgFilter(e.target.value)}
                  className="portal-input h-10 px-3 pe-8 text-sm font-bold bg-white dark:bg-surface-950 border-surface-200 dark:border-surface-700 min-w-[140px] max-w-[200px] truncate"
                >
                  <option value="all">
                    {t('common.all')} ({organizationsList.length})
                  </option>
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
                          {/* ... */}
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
                        <th className="px-3 md:px-6 py-4 portal-label-sm min-w-[200px]">
                          {t('requests.table.title')}
                        </th>
                        <th className="px-3 md:px-6 py-4 portal-label-sm text-center whitespace-nowrap">
                          {t('requests.table.status')}
                        </th>
                        <th className="px-3 md:px-6 py-4 portal-label-sm text-center whitespace-nowrap">
                          {t('requests.table.priority')}
                        </th>
                        <th className="px-3 md:px-6 py-4 portal-label-sm text-center whitespace-nowrap hidden md:table-cell">
                          {t('requests.table.created')}
                        </th>
                        <th className="px-3 md:px-6 py-4 portal-label-sm text-end whitespace-nowrap">
                          {t('common.actions')}
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
                            role="link"
                            tabIndex={isSelectionMode ? -1 : 0}
                            onClick={() => openRequest(req)}
                            onKeyDown={e => activateOnKeyboard(e, () => openRequest(req))}
                            className={cn(
                              'portal-focus-ring hover:bg-surface-50/50 dark:hover:bg-surface-800/30 group cursor-pointer relative outline-none',
                              isSelected && 'bg-primary-50 dark:bg-primary-900/10',
                              isNewlyPinned &&
                                'bg-amber-50/40 dark:bg-amber-500/10 ring-2 ring-amber-400/40 dark:ring-amber-500/30',
                              isPinned && 'ring-1 ring-amber-300/30 dark:ring-amber-500/20'
                            )}
                          >
                            {/* ... Columns ... */}
                            {/* Checkbox */}
                            {isAgency && isSelectionMode && (
                              <td className="px-3 py-4">
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
                                ) : req.pricingOfferId ? (
                                  <Badge variant="green" className="text-[9px]">
                                    {t('requests.hasPricing')}
                                  </Badge>
                                ) : null}
                              </td>
                            )}

                            <td className="px-3 md:px-6 py-4 min-w-0">
                              <div className="flex flex-col min-w-0">
                                {isAgency && req.orgId && (
                                  <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider truncate mb-0.5">
                                    {organizations[req.orgId]?.name || t('common.unknown')}
                                  </span>
                                )}
                                <motion.span
                                  layoutId={!isMobile ? `request-title-${req.id}` : undefined}
                                  className="font-bold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate font-outfit"
                                >
                                  {req.title}
                                </motion.span>
                                {/* ... */}
                                {/* Helper meta */}
                                <span className="text-xs font-bold text-surface-400 flex items-center gap-1.5 mt-1 font-outfit flex-wrap">
                                  {/* ... */}
                                </span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-3 md:px-6 py-4">
                              <div className="flex justify-center">
                                {/* ... Status Badge ... */}
                                <motion.div>
                                  {isAgency ? (
                                    <Badge variant={getStatusBadgeVariant(req.status)}>
                                      {t(getStatusTranslationKey(req.status) as any)}
                                    </Badge>
                                  ) : (
                                    <Badge variant={getClientStatusBadgeVariant(req.status)}>
                                      {t(getClientStatusTranslationKey(req.status, true) as any)}
                                    </Badge>
                                  )}
                                </motion.div>
                                {req.isFree && (
                                  <Badge variant="green" className="ms-2">
                                    {t('common.free')}
                                  </Badge>
                                )}
                              </div>
                            </td>

                            {/* Priority */}
                            <td className="px-3 md:px-6 py-4">
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
                                  {t(getPriorityTranslationKey(req.priority) as any)}
                                </span>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="px-3 md:px-6 py-4 hidden md:table-cell">
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
                            </td>

                            {/* Actions */}
                            <td className="px-3 md:px-6 py-4 text-end">
                              <div className="flex items-center justify-end gap-1">
                                <PinButton requestId={req.id} orgId={orgId as string} />
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    router.push(getPortalPath(`/requests/${req.id}/`));
                                  }}
                                  className="portal-focus-ring p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                  aria-label={req.title}
                                >
                                  <MessageSquare size={16} />
                                </button>
                                <Dropdown
                                  trigger={
                                    <span className="portal-focus-ring p-2 min-w-[44px] min-h-[44px] text-surface-400 hover:text-surface-900 dark:hover:text-white transition-all rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 inline-flex items-center justify-center">
                                      <MoreVertical size={16} />
                                    </span>
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
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
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
