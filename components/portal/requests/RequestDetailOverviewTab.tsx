'use client';

import { Calendar, User as UserIcon, Zap } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { RequestMilestones } from '@/components/portal/requests/RequestMilestones';
import { RequestAttachments } from '@/components/portal/requests/RequestAttachments';
import { formatPortalDate } from '@/lib/utils/portal-helpers';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { cn } from '@/lib/utils';
import type { Organization, Request } from '@/lib/types/portal';

interface RequestDetailOverviewTabProps {
  request: Request;
  isAgency: boolean;
  orgId: string;
  clientOrganization: Organization | null | undefined;
  locale: string;
  detailsLabel: string;
  clientLabel: string;
  submissionDateLabel: string;
  priorityStatusLabel: string;
  priorityLabel: string;
  recentlyLabel: string;
}

export function RequestDetailOverviewTab({
  request,
  isAgency,
  orgId,
  clientOrganization,
  locale,
  detailsLabel,
  clientLabel,
  submissionDateLabel,
  priorityStatusLabel,
  priorityLabel,
  recentlyLabel,
}: RequestDetailOverviewTabProps) {
  return (
    <div className="space-y-6 animate-in slide-in-from-start-4 duration-500">
      <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
        <CardSectionTitle className="mb-4">{detailsLabel}</CardSectionTitle>
        <div className="text-surface-600 dark:text-surface-300 leading-relaxed whitespace-pre-wrap font-medium">
          {request.description}
        </div>
        <div className="mt-10 pt-6 border-t border-surface-100 dark:border-surface-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isAgency && clientOrganization && (
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 shadow-sm shrink-0">
                {clientOrganization.branding?.iconUrl ? (
                  <img
                    src={clientOrganization.branding.iconUrl}
                    alt={clientOrganization.name}
                    className="w-4 h-4 object-cover rounded-full"
                  />
                ) : (
                  <UserIcon size={16} className="text-surface-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="portal-label-sm text-[10px] truncate">{clientLabel}</p>
                <Link
                  href={getPortalPath(`/agency/clients/${clientOrganization.id}`)}
                  className="portal-focus-ring text-sm font-bold text-surface-900 dark:text-white font-outfit hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate block rounded-md"
                >
                  {clientOrganization.name}
                </Link>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 shadow-sm">
              <Calendar size={16} className="text-surface-400" />
            </div>
            <div>
              <p className="portal-label-sm text-[10px]">{submissionDateLabel}</p>
              <p className="text-sm font-bold text-surface-900 dark:text-white font-outfit">
                {formatPortalDate(request.createdAt, 'MMMM d, yyyy', locale, recentlyLabel)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 shadow-sm">
              <Zap
                size={16}
                className={cn(
                  request.priority === 'HIGH' || request.priority === 'URGENT'
                    ? 'text-rose-500'
                    : 'text-amber-500'
                )}
              />
            </div>
            <div>
              <p className="portal-label-sm text-[10px]">{priorityStatusLabel}</p>
              <p className="text-sm font-bold text-surface-900 dark:text-white capitalize font-outfit">
                {priorityLabel}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <RequestMilestones request={request} isAgency={isAgency} />
      <RequestAttachments request={request} isAgency={isAgency} orgId={orgId} />
    </div>
  );
}
