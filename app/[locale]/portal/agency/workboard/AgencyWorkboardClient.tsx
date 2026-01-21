'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { DroppableColumn } from '@/components/portal/workboard/DroppableColumn';
import { DraggableCard } from '@/components/portal/workboard/DraggableCard';
import { InlineRequestForm } from '@/components/portal/workboard/InlineRequestForm';
import { WorkboardFilterBar } from '@/components/portal/workboard/WorkboardFilterBar';
import { RequestCard } from '@/components/portal/workboard/RequestCard';
import {
  getAllRequests,
  updateRequestStatus,
  deleteRequest,
  createRequest,
} from '@/lib/services/portal-requests';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
  Request,
  RequestStatus,
  REQUEST_STATUS,
  RequestPriority,
  REQUEST_TYPE,
} from '@/lib/types/portal';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useAgencyClients } from '@/lib/hooks/useAgencyClients';

import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useOrg } from '@/lib/context/OrgContext';
import { WorkboardSkeleton } from '@/components/portal/skeletons/WorkboardSkeleton';

import { useToast } from '@/components/portal/ui';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { cn } from '@/lib/utils';

import { BulkActionsBar } from '@/components/portal/workboard/BulkActionsBar';

interface Column {
  id: string;
  title: string;
  status: string[];
  color: 'slate' | 'blue' | 'amber' | 'emerald';
  targetStatus: RequestStatus;
}

export default function AgencyWorkboardClient() {
  const t = useTranslations('portal');
  const locale = useLocale();
  const router = useRouter();
  const { loading: auth, isAuthenticated, user, isAgency } = usePortalAuth();
  const { organizations } = useAgencyClients();
  const { switchOrg } = useOrg();
  const { success, error: showError } = useToast();

  // Data State
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'newest'>('newest');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());

  // Dragging State
  const [activeRequest, setActiveRequest] = useState<Request | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Action States
  const [creatingInColumnId, setCreatingInColumnId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [, setIsDeleting] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<{ id: string; title: string } | null>(
    null
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  useEffect(() => {
    if (!auth && isAuthenticated && user && isAgency) {
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
    } else if (!auth && (!isAuthenticated || !isAgency)) {
      setLoading(false);
    }
  }, [auth, isAuthenticated, user, isAgency, showError, t]);

  const columns: Column[] = useMemo(
    () => [
      {
        id: 'backlog',
        title: t('workboard.columns.backlog'),
        status: ['NEW', 'ON_HOLD', 'NEEDS_INFO'],
        color: 'slate',
        targetStatus: REQUEST_STATUS.NEW,
      },
      {
        id: 'in_progress',
        title: t('workboard.columns.inProgress'),
        status: ['IN_PROGRESS'],
        color: 'blue',
        targetStatus: 'IN_PROGRESS' as RequestStatus,
      },
      {
        id: 'review',
        title: t('workboard.columns.review'),
        status: ['IN_REVIEW', 'QA'],
        color: 'amber',
        targetStatus: 'IN_REVIEW' as RequestStatus,
      },
      {
        id: 'delivered',
        title: t('workboard.columns.delivered'),
        status: ['DELIVERED', 'COMPLETED', 'APPROVED'],
        color: 'emerald',
        targetStatus: 'DELIVERED' as RequestStatus,
      },
    ],
    [t]
  );

  const getRequestsForColumn = (column: Column) => {
    return filteredRequests.filter(req => column.status.includes(req.status));
  };

  // Filtering Logic
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

  // Handlers
  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRequests(newSelected);
  };

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

  const handleCreateRequest = async (title: string, columnId: string, orgId: string) => {
    if (!user || isCreating) return;

    const column = columns.find(c => c.id === columnId);
    const initialStatus = column?.targetStatus || REQUEST_STATUS.NEW;

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

  const onDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const request = requests.find(r => r.id === active.id);
    if (request) {
      setActiveRequest(request);
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveRequest(null);

    if (!over) return;

    const requestId = active.id as string;
    const overId = over.id as string;

    // Find if over is a column
    const column = columns.find(c => c.id === overId);

    if (column) {
      // Dropped on column
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      if (!column.status.includes(request.status)) {
        // Optimistic update
        const oldStatus = request.status;
        const newStatus = column.targetStatus;

        setRequests(prev => prev.map(r => (r.id === requestId ? { ...r, status: newStatus } : r)));

        try {
          await updateRequestStatus(requestId, newStatus);
        } catch (error) {
          console.error('Move failed', error);
          setRequests(prev =>
            prev.map(r => (r.id === requestId ? { ...r, status: oldStatus } : r))
          );
          showError(t('workboard.moveError'), 'Failed to update status');
        }
      }
    }
  };

  if (loading || auth) {
    return <WorkboardSkeleton />;
  }

  if (!isAuthenticated && !auth) {
    return null;
  }

  if (!isAgency) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-surface-500">{t('common.accessDenied')}</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      {/* Filter Bar */}
      <WorkboardFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showMyRequests={showMyRequests}
        onToggleMyRequests={() => setShowMyRequests(!showMyRequests)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={() => {
          setIsSelectionMode(!isSelectionMode);
          setSelectedRequests(new Set());
        }}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start pb-20 mt-8">
        {columns.map(column => {
          const columnRequests = getRequestsForColumn(column);
          return (
            <DroppableColumn
              key={column.id}
              id={column.id}
              title={column.title}
              itemIds={columnRequests.map(r => r.id)}
              itemCount={columnRequests.length}
              color={column.color}
              emptyMessage={t('workboard.emptyColumn')}
              onAddClick={() => setCreatingInColumnId(column.id)}
              isAdding={creatingInColumnId === column.id}
            >
              {creatingInColumnId === column.id && (
                <InlineRequestForm
                  columnId={column.id}
                  organizations={organizations}
                  onSubmit={handleCreateRequest}
                  onCancel={() => setCreatingInColumnId(null)}
                  isSubmitting={isCreating}
                />
              )}

              {columnRequests.map(req => (
                <DraggableCard key={req.id} id={req.id} disabled={isSelectionMode}>
                  <div
                    onClick={e => {
                      if (isSelectionMode) {
                        e.stopPropagation();
                        handleToggleSelection(req.id);
                      } else {
                        switchOrg(req.orgId);
                        router.push(getPortalPath(`/requests/${req.id}/`));
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={cn('outline-none rounded-2xl', isSelectionMode && 'cursor-default')}
                  >
                    <RequestCard
                      request={req}
                      locale={locale}
                      isMounted={isMounted}
                      onDelete={() => setRequestToDelete({ id: req.id, title: req.title })}
                      selectable={isSelectionMode}
                      selected={selectedRequests.has(req.id)}
                      onSelect={() => handleToggleSelection(req.id)}
                    />
                  </div>
                </DraggableCard>
              ))}
            </DroppableColumn>
          );
        })}
      </div>

      <BulkActionsBar
        selectedCount={selectedRequests.size}
        onClearSelection={() => setSelectedRequests(new Set())}
        onDelete={handleBulkDelete}
        onMoveTo={status => handleBulkMove(status as RequestStatus)}
      />

      {isMounted &&
        createPortal(
          <DragOverlay
            adjustScale={false}
            dropAnimation={{
              duration: 200,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}
          >
            {activeRequest ? (
              <div
                className="opacity-95 shadow-2xl shadow-blue-500/20 rounded-2xl"
                style={{ cursor: 'grabbing' }}
              >
                <RequestCard request={activeRequest} locale={locale} isMounted={isMounted} />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}

      {requestToDelete && (
        <ConfirmationModal
          isOpen={!!requestToDelete}
          onClose={() => setRequestToDelete(null)}
          onConfirm={async () => {
            if (requestToDelete) {
              try {
                await deleteRequest(requestToDelete.id);
                setRequests(prev => prev.filter(r => r.id !== requestToDelete.id));
                success(t('common.delete'), t('common.deleted'));
              } catch (_e) {
                showError(t('common.error'), 'Failed to delete');
              }
              setRequestToDelete(null);
            }
          }}
          title={t('common.delete')}
          description={t('common.deleteConfirm', { name: requestToDelete.title })}
        />
      )}
    </DndContext>
  );
}
