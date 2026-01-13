'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { PortalCard } from '@/components/portal/ui/PortalCard';
import { PortalBadge } from '@/components/portal/ui/PortalBadge';
import { PortalButton } from '@/components/portal/ui/PortalButton';
import { DraggableCard } from '@/components/portal/workboard/DraggableCard';
import { DroppableColumn } from '@/components/portal/workboard/DroppableColumn';
import { MessageSquare, Paperclip, Clock, Loader2 } from 'lucide-react';
import { PortalAvatar, PortalAvatarGroup } from '@/components/portal/ui/PortalAvatar';
import { getAllRequests, updateRequestStatus } from '@/lib/services/portal-requests';
import { Request, RequestStatus, REQUEST_STATUS } from '@/lib/types/portal';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { ShieldCheck } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { useOrg } from '@/lib/context/OrgContext';
import { WorkboardSkeleton } from '@/components/portal/skeletons/WorkboardSkeleton';
import { useOptimisticAction } from '@/lib/hooks/useOptimisticMutation';
import { useToast } from '@/components/portal/ui';
import { getPortalPath } from '@/lib/utils/portal-paths';

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
  const { userData, loading: authLoading, isAuthenticated, user } = usePortalAuth();
  const { switchOrg } = useOrg();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const columns: Column[] = [
    {
      id: 'backlog',
      title: t('agency.workboard.columns.backlog'),
      status: ['NEW', 'QUEUED', 'NEEDS_INFO'],
      color: 'slate',
      targetStatus: REQUEST_STATUS.QUEUED,
    },
    {
      id: 'inProgress',
      title: t('agency.workboard.columns.inProgress'),
      status: ['IN_PROGRESS'],
      color: 'blue',
      targetStatus: REQUEST_STATUS.IN_PROGRESS,
    },
    {
      id: 'review',
      title: t('agency.workboard.columns.review'),
      status: ['IN_REVIEW'],
      color: 'amber',
      targetStatus: REQUEST_STATUS.IN_REVIEW,
    },
    {
      id: 'delivered',
      title: t('agency.workboard.columns.delivered'),
      status: ['DELIVERED', 'CLOSED'],
      color: 'emerald',
      targetStatus: REQUEST_STATUS.DELIVERED,
    },
  ];

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

  // Measuring configuration to handle scroll containers properly
  const measuringConfig = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      if (!userData?.isAgency) {
        if (!authLoading && isAuthenticated && mounted) {
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setLoading(true);
      }
      try {
        const data = await getAllRequests();
        if (mounted) {
          setRequests(data);
        }
      } catch (error) {
        console.error('Error fetching workboard data:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (!authLoading) {
      fetchData();
    }

    return () => {
      mounted = false;
    };
  }, [userData, authLoading, isAuthenticated]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      alert('Permission repair failed. Check console for details.');
    } finally {
      setIsRepairing(false);
    }
  };

  const getRequestsForColumn = useCallback(
    (column: Column) => {
      return requests.filter(req => column.status.includes(req.status));
    },
    [requests]
  );

  const findColumnByRequestId = useCallback(
    (requestId: string): Column | undefined => {
      for (const column of columns) {
        const columnRequests = getRequestsForColumn(column);
        if (columnRequests.find(r => r.id === requestId)) {
          return column;
        }
      }
      return undefined;
    },
    [columns, getRequestsForColumn]
  );

  const { execute: moveRequest } = useOptimisticAction(
    (vars: { requestId: string; newStatus: RequestStatus; oldStatus: RequestStatus }) =>
      updateRequestStatus(vars.requestId, vars.newStatus),
    {
      onMutate: ({ requestId, newStatus }) => {
        const request = requests.find(r => r.id === requestId);
        const targetCol = columns.find(col => col.targetStatus === newStatus);

        setRequests(prev => prev.map(r => (r.id === requestId ? { ...r, status: newStatus } : r)));

        if (request && targetCol) {
          success(
            t('agency.workboard.moved'),
            `${request.title} → ${targetCol.title}`
          );
        }
      },
      onRollback: (_error, { requestId, oldStatus }) => {
        setRequests(prev => prev.map(r => (r.id === requestId ? { ...r, status: oldStatus } : r)));

        showError(t('agency.workboard.moveError'), t('common.rollback'));
      },
    }
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = () => {
    // Could add preview effects here
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeRequestId = active.id as string;
    const overId = over.id as string;

    // Find what column we're dropping over
    const targetColumn = columns.find(col => col.id === overId);
    if (!targetColumn) return;

    // Find the request and its current column
    const activeRequest = requests.find(r => r.id === activeRequestId);
    if (!activeRequest) return;

    const currentColumn = findColumnByRequestId(activeRequestId);
    if (!currentColumn || currentColumn.id === targetColumn.id) return;

    moveRequest({
      requestId: activeRequestId,
      newStatus: targetColumn.targetStatus,
      oldStatus: activeRequest.status,
    });
  };

  const activeRequest = activeId ? requests.find(r => r.id === activeId) : null;

  if (authLoading || (loading && userData?.isAgency)) {
    return <WorkboardSkeleton />;
  }

  if (!authLoading && isAuthenticated && !userData?.isAgency) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-10 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">{t('agency.accessDeniedTitle')}</h2>
        <p className="text-surface-500 max-w-sm mx-auto mb-8">
          {t('agency.notRegisteredAsAdmin', { email: user?.email || '' })}
        </p>
        <PortalButton
          onClick={handleRepair}
          disabled={isRepairing}
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          {isRepairing ? <Loader2 className="animate-spin me-2" size={16} /> : null}
          Repair Permissions & Reload
        </PortalButton>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      measuring={measuringConfig}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white leading-tight">
              {t('agency.workboard.title')}
            </h1>
            <p className="text-surface-500 dark:text-surface-400 mt-1">
              {t('agency.workboard.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PortalAvatarGroup max={3} className="me-2">
              <PortalAvatar name="CartShift Studio" size="sm" />
              <PortalAvatar name={t('common.namePlaceholder')} size="sm" />
            </PortalAvatarGroup>
            <PortalButton
              size="sm"
              variant="outline"
              className="h-10 px-4 font-bold border-surface-200 cursor-default"
            >
              {t('agency.workboard.roadmap')}
            </PortalButton>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
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
                emptyMessage={t('agency.workboard.emptyColumn')}
              >
                {columnRequests.map(req => (
                  <DraggableCard key={req.id} id={req.id}>
                    <div
                        onClick={() => {
                          switchOrg(req.orgId);
                          router.push(getPortalPath(`/requests/${req.id}/`));
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            switchOrg(req.orgId);
                            router.push(getPortalPath(`/requests/${req.id}/`));
                          }
                        }}
                      aria-label={`${t('agency.workboard.viewRequest')}: ${req.title}`}
                    >
                      <RequestCard request={req} locale={locale} isMounted={isMounted} />
                    </div>
                  </DraggableCard>
                ))}
              </DroppableColumn>
            );
          })}
        </div>
      </div>

      {/* Drag Overlay - Shows the card being dragged */}
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
    </DndContext>
  );
}

// Extracted RequestCard component for reuse
function RequestCard({
  request: req,
  locale,
  isMounted,
}: {
  request: Request;
  locale: string;
  isMounted: boolean;
}) {
  const t = useTranslations('portal');
  return (
    <PortalCard className="p-3 md:p-4 border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-sm font-bold text-surface-900 dark:text-white leading-snug group-hover:text-blue-600 transition-colors flex-1 min-w-0">
          {req.title}
        </h4>
        <PortalBadge
          variant={
            req.priority === 'HIGH' || req.priority === 'URGENT'
              ? 'red'
              : req.priority === 'NORMAL'
                ? 'yellow'
                : 'blue'
          }
          className="text-[9px] px-1.5 h-4 font-black uppercase tracking-tighter shrink-0"
        >
          {t(`requests.priority.${(req.priority || 'NORMAL').toLowerCase()}` as never)}
        </PortalBadge>
      </div>

      <p className="text-[11px] text-surface-500 line-clamp-2 mb-4 font-medium leading-relaxed">
        {req.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-surface-50 dark:border-surface-800/50">
        <div className="flex items-center gap-3">
          {req.assignedToName && (
            <PortalAvatar
              name={req.assignedToName}
              size="xs"
              className="ring-2 ring-white dark:ring-surface-900"
            />
          )}
          <div className="flex items-center gap-1 text-surface-400">
            <MessageSquare size={12} />
            <span className="text-[10px] font-bold">{req.commentCount || 0}</span>
          </div>
          {req.attachmentIds && req.attachmentIds.length > 0 && (
            <div className="flex items-center gap-1 text-surface-400">
              <Paperclip size={12} />
              <span className="text-[10px] font-bold">{req.attachmentIds.length}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-surface-400">
          <Clock size={12} className="text-surface-300" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">
            {isMounted && req.createdAt?.toDate
              ? formatDistanceToNow(req.createdAt.toDate(), {
                  addSuffix: true,
                  locale: getDateLocale(locale),
                })
              : '—'}
          </span>
        </div>
      </div>
    </PortalCard>
  );
}
