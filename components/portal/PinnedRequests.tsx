'use client';

import React from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Pin, ExternalLink, X } from 'lucide-react';
import { usePortalTranslations } from '@/lib/i18n/translations';
import { Request } from '@/lib/types/portal';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getStatusBadgeVariant, getClientStatusBadgeVariant } from '@/lib/utils/portal-helpers';
import { usePinnedRequests } from '@/lib/hooks/usePinnedRequests';
import { useOpenRequest } from '@/lib/hooks/useOpenRequest';
import { getStatusTranslationKey, getClientStatusTranslationKey } from '@/lib/i18n/portal-translation-keys';

interface PinnedRequestsProps {
  requests: Request[];
  orgId: string;
  locale: string;
  isAgency?: boolean;
  className?: string;
}

export const PinnedRequests: React.FC<PinnedRequestsProps> = ({
  requests,
  orgId,
  locale: _locale, // Deprecated - kept for backwards compatibility
  isAgency = false,
  className,
}) => {
  const t = usePortalTranslations();
  const { pinnedIds, unpinRequest } = usePinnedRequests(orgId);
  const { openRequest } = useOpenRequest();

  // Filter to only show pinned requests that still exist
  const pinnedRequests = requests.filter(r => pinnedIds.includes(r.id));

  if (pinnedRequests.length === 0) {
    return null;
  }

  return (
    <Card
      variant="glass"
      accent="warning"
      padding="sm"
      className={cn('overflow-hidden', className)}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3">
        <div className="w-6 h-6 rounded-lg bg-amber-600 dark:bg-amber-500 flex items-center justify-center">
          <Pin size={12} className="text-white" />
        </div>
        {t('dashboard.pinned.title')}
        <Badge variant="yellow" size="xs" className="ms-auto" glow>
          {pinnedRequests.length}
        </Badge>
      </div>

      <AnimatePresence mode="popLayout">
        {pinnedRequests.map((request, index) => (
          <motion.div
            key={request.id}
            layout
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, x: -20 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="group relative p-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/30 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={event => {
                    if (event.metaKey || event.ctrlKey) {
                      openRequest(request.id, { orgId: request.orgId, fullPage: true });
                      return;
                    }
                    openRequest(request.id, { orgId: request.orgId });
                  }}
                  className="portal-focus-ring group/link flex items-center gap-2 rounded-md text-start w-full"
                >
                  <span className="text-sm font-medium text-surface-900 dark:text-white truncate group-hover/link:text-primary-600 dark:group-hover/link:text-primary-400 transition-colors">
                    {request.title}
                  </span>
                  <ExternalLink
                    size={12}
                    className="flex-shrink-0 opacity-0 group-hover/link:opacity-100 text-primary-500 transition-opacity"
                  />
                </button>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={
                      isAgency
                        ? getStatusBadgeVariant(request.status)
                        : getClientStatusBadgeVariant(request.status)
                    }
                    size="xs"
                    dot
                  >
                    {isAgency
                      ? t(getStatusTranslationKey(request.status))
                      : t(getClientStatusTranslationKey(request.status, true))}
                  </Badge>
                  <span className="text-[10px] text-surface-400 font-mono">
                    #{request.id.slice(-6).toUpperCase()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => unpinRequest(request.id)}
                className="portal-focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center p-1.5 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-amber-200/50 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-all"
                aria-label={t('dashboard.pinned.unpin')}
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </Card>
  );
};

/**
 * Pin button to add to request cards/rows
 */
interface PinButtonProps {
  requestId: string;
  orgId: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const PinButton: React.FC<PinButtonProps> = ({
  requestId,
  orgId,
  size = 'sm',
  className,
}) => {
  const t = usePortalTranslations();
  const { isPinned, isPinning, togglePin, loadingRequestIds } = usePinnedRequests(orgId);
  const pinned = isPinned(requestId);
  const loading = loadingRequestIds?.has(requestId) ?? isPinning(requestId);

  return (
    <button
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        togglePin(requestId);
      }}
      disabled={loading}
      className={cn(
        'portal-focus-ring transition-all relative',
        size === 'sm' ? 'p-1.5 rounded-lg' : 'p-2.5 rounded-xl',
        pinned
          ? 'text-amber-500 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30'
          : 'text-surface-400 hover:text-amber-500 hover:bg-surface-100 dark:hover:bg-surface-800',
        loading && 'opacity-70 cursor-wait animate-pulse',
        className
      )}
      aria-label={pinned ? t('dashboard.pinned.unpin') : t('dashboard.pinned.pin')}
      title={pinned ? t('dashboard.pinned.unpin') : t('dashboard.pinned.pin')}
    >
      <Pin size={size === 'sm' ? 14 : 18} className={cn(pinned && 'fill-current')} />
    </button>
  );
};
