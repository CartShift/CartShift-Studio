'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { Request } from '@/lib/types/portal';
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { MoreVertical, Trash2, MessageSquare, Paperclip, Check } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assumed utility

interface RequestCardProps {
  request: Request;
  locale: string;
  isMounted: boolean;
  onDelete?: () => void;
}

export function RequestCard({
  request: req,
  locale,
  isMounted,
  onDelete,
  selectable,
  selected,
  onSelect,
}: RequestCardProps & {
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const t = useTranslations('portal');

  return (
    <Card
      className={cn(
        'p-3 md:p-4 border-surface-200 dark:border-surface-800 shadow-sm hover:shadow-md transition-all group relative bg-white dark:bg-surface-900',
        selected
          ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/10'
          : 'hover:border-blue-200 dark:hover:border-blue-900'
      )}
    >
      {/* Selection Checkbox */}
      {selectable && (
        <div
          className={cn(
            'absolute top-3 start-3 z-20 transition-opacity',
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
          onClick={e => {
            e.stopPropagation();
            onSelect?.();
          }}
        >
          <div
            className={cn(
              'w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer',
              selected
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white dark:bg-surface-800 border-surface-300 dark:border-surface-600 hover:border-blue-400'
            )}
          >
            {selected && <Check size={12} strokeWidth={4} />}
          </div>
        </div>
      )}

      {/* Actions (Hover) - Hide if selectable/selected to avoid clutter */}
      {!selectable && (
        <div
          className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={e => e.stopPropagation()}
        >
          <Dropdown
            trigger={
              <button className="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-400">
                <MoreVertical size={14} />
              </button>
            }
            items={[
              {
                label: t('common.delete') || 'Delete',
                icon: <Trash2 size={14} />,
                onClick: onDelete || (() => {}),
                variant: 'danger',
              },
            ]}
          />
        </div>
      )}

      {/* Header: Priority & ID/Date */}
      <div className={cn('flex items-center justify-between gap-2 mb-2', selectable && 'ps-7')}>
        <Badge
          variant={
            req.priority === 'HIGH' || req.priority === 'URGENT'
              ? 'red'
              : req.priority === 'NORMAL'
                ? 'yellow'
                : 'blue'
          }
          className="text-[9px] px-1.5 h-4 font-black uppercase tracking-tighter shrink-0"
        >
          {t(`requests.priority.${(req.priority || 'NORMAL').toLowerCase()}` as any)}
        </Badge>

        <span className="text-[10px] text-surface-400 font-medium">
          {isMounted && req.createdAt?.toDate
            ? formatDistanceToNow(req.createdAt.toDate(), {
                addSuffix: true,
                locale: getDateLocale(locale),
              })
            : ''}
        </span>
      </div>

      {/* Title */}
      <h4
        className={cn(
          'text-sm font-bold text-surface-900 dark:text-white leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-3',
          selectable && 'ps-0'
        )}
      >
        {req.title}
      </h4>

      {/* Footer: User & Stats */}
      <div className="flex items-center justify-between pt-2 border-t border-surface-50 dark:border-surface-800/50 mt-1">
        {/* User Avatar */}
        <div className="flex items-center -space-x-2">
          {req.assignedToName ? (
            <Avatar
              name={req.assignedToName}
              size="xs"
              className="ring-2 ring-white dark:ring-surface-900 w-5 h-5 text-[9px]"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-surface-100 dark:bg-surface-800 border border-dashed border-surface-300 dark:border-surface-600" />
          )}
        </div>

        {/* Icons */}
        <div className="flex items-center gap-3 text-surface-400">
          <div className="flex items-center gap-1" title="Comments">
            <MessageSquare size={12} />
            <span className="text-[10px] font-bold">{req.commentCount || 0}</span>
          </div>
          {req.attachmentIds && req.attachmentIds.length > 0 && (
            <div className="flex items-center gap-1" title="Attachments">
              <Paperclip size={12} />
              <span className="text-[10px] font-bold">{req.attachmentIds.length}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
