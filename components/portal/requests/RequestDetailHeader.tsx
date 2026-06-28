'use client';

import { motion } from '@/lib/motion';
import { ArrowLeft, ExternalLink, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PinButton } from '@/components/portal/PinnedRequests';
import { getStatusBadgeVariant, getClientStatusBadgeVariant } from '@/lib/utils/portal-helpers';
import type { Request } from '@/lib/types/portal';
import { getPortalPath } from '@/lib/utils/portal-paths';

interface RequestDetailHeaderProps {
  request: Request;
  orgId: string;
  isAgency: boolean;
  isPreview: boolean;
  animateLayout: boolean;
  onClosePreview?: () => void;
  onExpandPreview?: () => void;
  typeLabel: string;
  statusLabel: string;
  closePreviewLabel: string;
  openFullPageLabel: string;
}

export function RequestDetailHeader({
  request,
  orgId,
  isAgency,
  isPreview,
  animateLayout,
  onClosePreview,
  onExpandPreview,
  typeLabel,
  statusLabel,
  closePreviewLabel,
  openFullPageLabel,
}: RequestDetailHeaderProps) {
  return (
    <motion.div
      layoutId={animateLayout ? `request-container-${request.id}` : undefined}
      className="flex flex-col md:flex-row md:items-center gap-6 p-4 rounded-xl"
    >
      {isPreview ? (
        <div className="flex items-center gap-2 self-start">
          <button
            type="button"
            onClick={onClosePreview}
            aria-label={closePreviewLabel}
            className="portal-focus-ring p-2.5 border border-surface-200 dark:border-surface-800 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors shadow-sm bg-white dark:bg-surface-950"
          >
            <X size={20} className="text-surface-500" />
          </button>
          <Button variant="outline" size="sm" onClick={onExpandPreview} className="font-outfit gap-2">
            <ExternalLink size={16} />
            {openFullPageLabel}
          </Button>
        </div>
      ) : (
        <Link
          href={getPortalPath('/requests/')}
          className="p-2.5 border border-surface-200 dark:border-surface-800 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors shadow-sm bg-white dark:bg-surface-950"
        >
          <ArrowLeft size={20} className="text-surface-500" />
        </Link>
      )}
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <motion.h1
            layoutId={animateLayout ? `request-title-${request.id}` : undefined}
            className="text-2xl font-bold text-surface-900 dark:text-white leading-tight font-outfit"
          >
            {request.title}
          </motion.h1>
          <motion.div layoutId={animateLayout ? `request-status-${request.id}` : undefined}>
            <Badge
              variant={
                isAgency
                  ? getStatusBadgeVariant(request.status)
                  : getClientStatusBadgeVariant(request.status)
              }
            >
              {statusLabel}
            </Badge>
          </motion.div>
        </div>
        <div className="flex items-center gap-3 mt-1 underline-offset-4">
          <p className="portal-label-sm">{typeLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start md:self-center">
        <PinButton
          requestId={request.id}
          orgId={orgId}
          size="md"
          className="w-10 h-10 border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 hover:border-surface-300 dark:hover:border-surface-700 shadow-sm"
        />
      </div>
    </motion.div>
  );
}
