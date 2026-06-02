'use client';

import { createPortal } from 'react-dom';
import { DndContext, DragOverlay, closestCorners, MeasuringStrategy } from '@dnd-kit/core';

import { DroppableColumn } from '@/components/portal/workboard/DroppableColumn';
import { DraggableCard } from '@/components/portal/workboard/DraggableCard';
import { InlineRequestForm } from '@/components/portal/workboard/InlineRequestForm';
import { WorkboardFilterBar } from '@/components/portal/workboard/WorkboardFilterBar';
import { RequestCard } from '@/components/portal/workboard/RequestCard';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { RequestStatus } from '@/lib/types/portal';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useAgencyClients } from '@/lib/hooks/useAgencyClients';
import { useWorkboardState, type Column } from '@/lib/hooks/useWorkboardState';

import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useOrg } from '@/lib/context/OrgContext';
import { WorkboardSkeleton } from '@/components/portal/skeletons/WorkboardSkeleton';

import { useToast } from '@/components/portal/ui';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { activateOnKeyboard } from '@/lib/utils/portal-interactive';
import { cn } from '@/lib/utils';

import { BulkActionsBar } from '@/components/portal/workboard/BulkActionsBar';

export default function AgencyWorkboardClient() {
  const t = useTranslations('portal');
  const locale = useLocale();
  const router = useRouter();
  const { loading: auth, isAuthenticated, user, isAgency } = usePortalAuth();
  const { organizations } = useAgencyClients();
  const { switchOrg } = useOrg();
  const { success, error: showError } = useToast();

  const {
    // Data
    loading,
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
  } = useWorkboardState({
    t: t as (key: string, params?: Record<string, unknown>) => string,
    authLoading: auth,
    isAuthenticated,
    user,
    isAgency,
    organizations,
    success,
    showError,
  });

  const openRequest = (req: { id: string; orgId: string }) => {
    if (isSelectionMode) return;
    switchOrg(req.orgId);
    router.push(getPortalPath(`/requests/${req.id}/`));
  };

  // ── Column Rendering Helper ──────────────────────────────────
  const renderColumn = (column: Column, isHiddenOnMobile: boolean) => {
    const columnRequests = getRequestsForColumn(column);

    return (
      <div key={column.id} className={cn('w-full', isHiddenOnMobile && 'hidden md:block')}>
        <DroppableColumn
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
                    openRequest(req);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (isSelectionMode) return;
                  activateOnKeyboard(e, () => openRequest(req));
                }}
                className={cn(
                  'portal-focus-ring rounded-2xl outline-none',
                  isSelectionMode && 'cursor-default'
                )}
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
      </div>
    );
  };

  // ── Guards ───────────────────────────────────────────────────
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

  // ── Main Render ──────────────────────────────────────────────
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

      {/* Mobile Column Tabs */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide snap-x">
        {columns.map(col => {
          const columnRequests = getRequestsForColumn(col);
          const isActive = activeMobileTab === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveMobileTab(col.id)}
              className={cn(
                'portal-focus-ring flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all snap-center whitespace-nowrap flex items-center gap-2',
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
              )}
              aria-label={`${col.title} column, ${columnRequests.length} items`}
              aria-pressed={isActive}
            >
              {col.title}
              {columnRequests.length > 0 && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs font-black min-w-[20px] text-center',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                  )}
                >
                  {columnRequests.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start pb-20 mt-4 md:mt-8">
        {columns.map(column => renderColumn(column, activeMobileTab !== column.id))}
      </div>

      {/* Bulk Actions */}
      <BulkActionsBar
        selectedCount={selectedRequests.size}
        onClearSelection={() => setSelectedRequests(new Set())}
        onDelete={handleBulkDelete}
        onMoveTo={status => handleBulkMove(status as RequestStatus)}
      />

      {/* Drag Overlay */}
      {isMounted &&
        createPortal(
          <DragOverlay
            adjustScale={false}
            dropAnimation={{
              duration: 200,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {activeRequest ? (
              <div
                className="opacity-95 shadow-2xl shadow-primary-500/20 rounded-2xl"
                style={{ cursor: 'grabbing' }}
              >
                <RequestCard request={activeRequest} locale={locale} isMounted={isMounted} />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}

      {/* Delete Confirmation */}
      {requestToDelete && (
        <ConfirmationModal
          isOpen={!!requestToDelete}
          onClose={() => setRequestToDelete(null)}
          onConfirm={handleDeleteRequest}
          title={t('common.delete')}
          description={t('common.deleteConfirm', { name: requestToDelete.title })}
        />
      )}
    </DndContext>
  );
}
