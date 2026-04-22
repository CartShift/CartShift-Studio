'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import {
  getAllRequests,
  updateRequestStatus,
  deleteRequest,
  createRequest,
} from '@/lib/services/portal-requests';
import {
  Request,
  RequestStatus,
  REQUEST_STATUS,
  RequestPriority,
  REQUEST_TYPE,
} from '@/lib/types/portal';
import type { EnhancedOrganization } from '@/lib/hooks/useAgencyClients';

/**
 * Column definition used by the workboard.
 *
 * Pattern:
 * - `status`: Array of request statuses that map requests into this column.
 *   A request appears in this column when its current status is included in this array.
 * - `defaultNewStatus`: The status assigned when:
 *   1. A new request is created inline in this column, or
 *   2. An existing request is dragged-and-dropped into this column.
 */
export interface Column {
  id: string;
  title: string;
  /** Request statuses that belong in this column. */
  status: string[];
  color: 'slate' | 'blue' | 'amber' | 'emerald';
  /** Status applied to new/dragged requests in this column. */
  defaultNewStatus: RequestStatus;
}

interface UseWorkboardStateParams {
  t: (key: string, params?: Record<string, unknown>) => string;
  authLoading: boolean;
  isAuthenticated: boolean;
  user: { uid: string; displayName: string | null } | null;
  isAgency: boolean;
  organizations: EnhancedOrganization[];
  success: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
}

export function useWorkboardState({
  t,
  authLoading,
  isAuthenticated,
  user,
  isAgency,
  organizations,
  success,
  showError,
}: UseWorkboardStateParams) {
  // ── Data State ──────────────────────────────────────────────
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  // ── UI State ────────────────────────────────────────────────
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'newest'>('newest');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  // ── Selection State ─────────────────────────────────────────
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());

  // ── Dragging State ──────────────────────────────────────────
  const [activeRequest, setActiveRequest] = useState<Request | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // ── Action States ───────────────────────────────────────────
  const [creatingInColumnId, setCreatingInColumnId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [, setIsDeleting] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<{ id: string; title: string } | null>(
    null
  );

  // ── Mobile Tabs State ──────────────────────────────────────
  const [activeMobileTab, setActiveMobileTab] = useState('backlog');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── DnD Sensors ─────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ── Fetch Requests ──────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && isAgency) {
      const fetchRequests = async () => {
        try {
          const data = await getAllRequests();
          setRequests(data);
        } catch (error) {
          console.error('Failed to fetch requests', error);
          showError(t('common.error'), 'Failed to fetch requests');
        } finally {
          setLoading(false);
        }
      };
      fetchRequests();
    } else if (!authLoading && (!isAuthenticated || !isAgency)) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, user, isAgency, showError, t]);

  // ── Column Definitions ──────────────────────────────────────
  const columns: Column[] = useMemo(
    () => [
      {
        id: 'backlog',
        title: t('workboard.columns.backlog'),
        status: ['NEW', 'ON_HOLD', 'NEEDS_INFO'],
        color: 'slate',
        defaultNewStatus: REQUEST_STATUS.NEW,
      },
      {
        id: 'in_progress',
        title: t('workboard.columns.inProgress'),
        status: ['IN_PROGRESS'],
        color: 'blue',
        defaultNewStatus: 'IN_PROGRESS' as RequestStatus,
      },
      {
        id: 'review',
        title: t('workboard.columns.review'),
        status: ['IN_REVIEW', 'QA'],
        color: 'amber',
        defaultNewStatus: 'IN_REVIEW' as RequestStatus,
      },
      {
        id: 'delivered',
        title: t('workboard.columns.delivered'),
        status: ['DELIVERED', 'COMPLETED', 'APPROVED'],
        color: 'emerald',
        defaultNewStatus: 'DELIVERED' as RequestStatus,
      },
    ],
    [t]
  );

  // ── Filtered & Sorted Requests ──────────────────────────────
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    if (showMyRequests && user) {
      const myOrgIds = new Set(
        organizations.filter(org => org.responsibleAgencyUserId === user.uid).map(org => org.id)
      );
      result = result.filter(req => myOrgIds.has(req.orgId) || req.assignedTo === user.uid);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        req =>
          req.title.toLowerCase().includes(q) ||
          req.description?.toLowerCase().includes(q) ||
          req.id.toLowerCase().includes(q)
      );
    }

    if (priorityFilter) {
      result = result.filter(req => req.priority === priorityFilter);
    }

    if (sortBy === 'priority') {
      const priorityOrder: Record<string, number> = { URGENT: 3, HIGH: 2, NORMAL: 1, LOW: 0 };
      result.sort(
        (a, b) =>
          (priorityOrder[b.priority || 'NORMAL'] || 0) -
          (priorityOrder[a.priority || 'NORMAL'] || 0)
      );
    } else if (sortBy === 'newest' || sortBy === 'date') {
      result.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA;
      });
    }

    return result;
  }, [requests, showMyRequests, searchQuery, sortBy, priorityFilter, user, organizations]);

  const getRequestsForColumn = (column: Column) => {
    return filteredRequests.filter(req => column.status.includes(req.status));
  };

  // ── Selection Handler ───────────────────────────────────────
  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRequests(newSelected);
  };

  // ── Bulk Delete ─────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (selectedRequests.size === 0) return;
    if (!confirm(t('common.deleteConfirm', { name: `${selectedRequests.size} items` }))) return;

    setIsDeleting(true);
    try {
      await Promise.all(Array.from(selectedRequests).map(id => deleteRequest(id)));
      setRequests(prev => prev.filter(r => !selectedRequests.has(r.id)));
      success(t('common.delete'), `${selectedRequests.size} items deleted`);
      setSelectedRequests(new Set());
      setIsSelectionMode(false);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      showError(t('common.error'), 'Failed to delete items');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Bulk Move ───────────────────────────────────────────────
  const handleBulkMove = async (newStatus: RequestStatus) => {
    if (selectedRequests.size === 0) return;

    try {
      await Promise.all(Array.from(selectedRequests).map(id => updateRequestStatus(id, newStatus)));
      setRequests(prev =>
        prev.map(r => (selectedRequests.has(r.id) ? { ...r, status: newStatus } : r))
      );
      success(t('common.save'), `${selectedRequests.size} items moved`);
      setSelectedRequests(new Set());
      setIsSelectionMode(false);
    } catch (err) {
      console.error('Bulk move failed:', err);
      showError(t('common.error'), 'Failed to move items');
    }
  };

  // ── Create Request ──────────────────────────────────────────
  const handleCreateRequest = async (title: string, columnId: string, orgId: string) => {
    if (!user || isCreating) return;

    const column = columns.find(c => c.id === columnId);
    const initialStatus = column?.defaultNewStatus || REQUEST_STATUS.NEW;

    setIsCreating(true);
    try {
      const newRequest = await createRequest(orgId, user.uid, user.displayName || 'Agency User', {
        title,
        description: '',
        type: REQUEST_TYPE.OTHER,
        priority: 'NORMAL' as RequestPriority,
        tags: [],
      });

      if (initialStatus !== REQUEST_STATUS.NEW) {
        const statusToSet = initialStatus;
        await updateRequestStatus(newRequest.id, statusToSet);
        newRequest.status = statusToSet;
      }

      setRequests(prev => [newRequest, ...prev]);
      success(t('common.created'), title);
      setCreatingInColumnId(null);
    } catch (err) {
      console.error('Failed to create request:', err);
      showError(t('common.error'), 'Failed to create request');
    } finally {
      setIsCreating(false);
    }
  };

  // ── Delete Confirmed Request ────────────────────────────────
  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    try {
      await deleteRequest(requestToDelete.id);
      setRequests(prev => prev.filter(r => r.id !== requestToDelete.id));
      success(t('common.delete'), t('common.deleted'));
    } catch (_e) {
      showError(t('common.error'), 'Failed to delete');
    }
    setRequestToDelete(null);
  };

  // ── DnD: Drag Start ────────────────────────────────────────
  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const request = requests.find(r => r.id === active.id);
    if (request) {
      setActiveRequest(request);
    }
  };

  // ── DnD: Drag End (with optimistic update) ─────────────────
  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveRequest(null);

    if (!over) return;

    const requestId = active.id as string;
    const overId = over.id as string;

    // Find if the drop target is a column
    const column = columns.find(c => c.id === overId);

    if (column) {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Only move if the request isn't already in this column's statuses
      if (!column.status.includes(request.status)) {
        const oldStatus = request.status;
        const newStatus = column.defaultNewStatus;

        // Optimistic update — update UI immediately
        setRequests(prev => prev.map(r => (r.id === requestId ? { ...r, status: newStatus } : r)));

        try {
          await updateRequestStatus(requestId, newStatus);
          success(t('common.moved'));
        } catch (error) {
          console.error('Move failed', error);
          // Revert on failure
          setRequests(prev =>
            prev.map(r => (r.id === requestId ? { ...r, status: oldStatus } : r))
          );
          showError(t('workboard.moveError'), 'Failed to update status');
        }
      }
    }
  };

  return {
    // Data
    requests,
    loading,
    filteredRequests,
    getRequestsForColumn,
    columns,

    // UI State
    showMyRequests,
    setShowMyRequests,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    priorityFilter,
    setPriorityFilter,
    activeMobileTab,
    setActiveMobileTab,
    isMounted,

    // Selection
    isSelectionMode,
    setIsSelectionMode,
    selectedRequests,
    setSelectedRequests,
    handleToggleSelection,

    // Dragging
    sensors,
    activeRequest,
    onDragStart,
    onDragEnd,

    // Actions
    creatingInColumnId,
    setCreatingInColumnId,
    isCreating,
    requestToDelete,
    setRequestToDelete,
    handleBulkDelete,
    handleBulkMove,
    handleCreateRequest,
    handleDeleteRequest,
  };
}
