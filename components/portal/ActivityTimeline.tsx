import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { timelineItem, timelineItemRTL } from '@/lib/animation-variants';
import { useLocale, useTranslations } from 'next-intl';
import { cva } from 'class-variance-authority';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  MessageSquare,
  UserPlus,
  Zap,
  Play,
  RotateCcw,
  Plus,
  Filter,
} from 'lucide-react';

import { PortalEmptyState } from '@/components/portal/ui/PortalEmptyState';
import { cn } from '@/lib/utils';
import { ActivityLog } from '@/lib/types/portal';
import { Timestamp } from 'firebase/firestore';
import { Link } from '@/i18n/navigation';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale, isRTLLocale } from '@/lib/locale-config';

interface ActivityTimelineProps {
  activities: ActivityLog[];
  /** @deprecated No longer needed - URLs use context-based org */
  orgId?: string;
  maxItems?: number;
  className?: string;
  showFilters?: boolean;
}

const formatTimeAgo = (timestamp: Timestamp, locale: string): string => {
  if (!timestamp) return '';
  return formatDistanceToNow(timestamp.toDate(), {
    addSuffix: true,
    locale: getDateLocale(locale),
  });
};

type FilterType = 'all' | 'requests' | 'comments' | 'payments';

const FILTER_ACTIONS: Record<FilterType, string[]> = {
  all: [],
  requests: [
    'CREATED_REQUEST',
    'ASSIGNED_REQUEST',
    'STARTED_WORK',
    'ACCEPTED_QUOTE',
    'DECLINED_QUOTE',
  ],
  comments: ['ADDED_COMMENT'],
  payments: ['ADDED_PRICING', 'PAID_REQUEST'],
};

const filterButtonVariants = cva(
  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200',
  {
    variants: {
      active: {
        true: 'bg-blue-600 text-white shadow-sm',
        false:
          'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

const activityIconVariants = cva(
  'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center z-10 border border-transparent group-hover:border-surface-200 dark:group-hover:border-surface-700 transition-all',
  {
    variants: {
      action: {
        CREATED_REQUEST: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
        ASSIGNED_REQUEST:
          'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30',
        ADDED_PRICING:
          'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
        ACCEPTED_QUOTE: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
        DECLINED_QUOTE: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30',
        STARTED_WORK: 'text-blue-500 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20',
        PAID_REQUEST: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
        ADDED_COMMENT:
          'text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-900/30',
        DEFAULT: 'text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-900/30',
      },
    },
    defaultVariants: {
      action: 'DEFAULT',
    },
  }
);

const ACTION_ICONS: Record<string, typeof Plus> = {
  CREATED_REQUEST: Plus,
  ASSIGNED_REQUEST: UserPlus,
  ADDED_PRICING: DollarSign,
  ACCEPTED_QUOTE: CheckCircle2,
  DECLINED_QUOTE: RotateCcw,
  STARTED_WORK: Play,
  PAID_REQUEST: Zap,
  ADDED_COMMENT: MessageSquare,
  DEFAULT: Clock,
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  orgId: _orgId, // Deprecated - kept for backwards compatibility
  maxItems = 10,
  className,
  showFilters = false,
}) => {
  const locale = useLocale();
  const t = useTranslations('portal.activity.actions');
  const tActivity = useTranslations('portal.activity');
  const isHe = isRTLLocale(locale);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredActivities = useMemo(() => {
    if (activeFilter === 'all') return activities;
    const allowedActions = FILTER_ACTIONS[activeFilter];
    return activities.filter(a => allowedActions.includes(a.action));
  }, [activities, activeFilter]);

  const visibleActivities = useMemo(() => {
    return filteredActivities.slice(0, maxItems);
  }, [filteredActivities, maxItems]);

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: tActivity('filters.all') },
    { key: 'requests', label: tActivity('filters.requests') },
    { key: 'comments', label: tActivity('filters.comments') },
    { key: 'payments', label: tActivity('filters.payments') },
  ];

  if (visibleActivities.length === 0 && activeFilter === 'all') {
    return (
      <PortalEmptyState
        icon={Clock}
        title={tActivity('noActivity')}
        description={tActivity('noActivityDescription')}
        variant="plain"
        illustration="activity"
        className={cn('bg-transparent border-0 py-8', className)}
      />
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Buttons */}
      {showFilters && activities.length > 0 && (
        <div className={cn('flex items-center gap-2 pb-2', isHe && 'flex-row-reverse')}>
          <Filter className="w-4 h-4 text-surface-400" />
          <div className="flex gap-1.5">
            {filterButtons.map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={filterButtonVariants({ active: activeFilter === filter.key })}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtered Empty State */}
      {visibleActivities.length === 0 && activeFilter !== 'all' && (
        <div className="text-center py-8 text-surface-500 dark:text-surface-400">
          <p className="text-sm font-medium">{tActivity('noFilteredActivity')}</p>
        </div>
      )}

      {/* Activity List */}
      <AnimatePresence mode="popLayout">
        {visibleActivities.map((activity, index) => {
          const Icon = ACTION_ICONS[activity.action] || ACTION_ICONS.DEFAULT;

          return (
            <motion.div
              key={activity.id}
              layout
              variants={isHe ? timelineItemRTL : timelineItem}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: isHe ? 20 : -20 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              {/* Connector line */}
              {index < visibleActivities.length - 1 && (
                <div
                  className={cn(
                    'absolute top-9 -bottom-10 w-0.5 bg-surface-100 dark:bg-surface-800',
                    isHe ? 'end-9' : 'start-9'
                  )}
                />
              )}

              <Link
                href={activity.requestId ? `/portal/requests/${activity.requestId}` : '#'}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-2xl hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-all cursor-pointer group hover-lift-sm',
                  isHe && 'flex-row-reverse text-end'
                )}
              >
                {/* Icon Container */}
                <div className={cn(activityIconVariants({ action: activity.action as any }))}>
                  <Icon size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-surface-900 dark:text-white truncate font-outfit">
                      {t(activity.action.toLowerCase() as any) ||
                        String(activity.action).replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-black text-surface-400 uppercase tracking-tight whitespace-nowrap">
                      {formatTimeAgo(activity.createdAt, locale)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-surface-500 font-medium">
                      {String(activity.userName)}
                    </span>
                    {activity.details?.title ? (
                      <>
                        <span className="w-1 h-1 rounded-full bg-surface-300" />
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold truncate">
                          {String(activity.details.title)}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
