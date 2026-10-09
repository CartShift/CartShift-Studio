'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AlertCircle, ArrowUpRight, CheckCircle2, ClipboardList, Clock3, FileText, FolderKanban, Plus, Users } from 'lucide-react';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useRequests } from '@/lib/hooks/useRequests';
import { getAllOrganizations } from '@/lib/services/portal-organizations';
import { listClientProjects } from '@/lib/services/portal-projects';
import { useOpenRequest } from '@/lib/hooks/useOpenRequest';
import { canAccessNav, PERMISSIONS } from '@/lib/utils/permissions';
import { PortalPageHeader } from '@/components/portal/ui/PortalPageHeader';
import { PortalMetricCard } from '@/components/portal/ui/PortalMetricCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { getStatusBadgeVariant } from '@/lib/utils/portal-helpers';
import { getStatusTranslationKey } from '@/lib/i18n/portal-translation-keys';
import type { Request } from '@/lib/types/portal';

const attentionStatuses = new Set(['NEW', 'NEEDS_INFO', 'CHANGES_REQUESTED', 'IN_REVIEW']);
const waitingStatuses = new Set(['QUOTED']);
const activeProjectStatuses = new Set(['planning', 'in_progress', 'client_review', 'blocked', 'ready_to_launch']);
const priorityWeight: Record<string, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };

function priorityScore(request: Request): number {
  return (attentionStatuses.has(request.status) ? 20 : 0) + (priorityWeight[request.priority] || 0);
}

export default function AgencyDashboardClient() {
  const t = useTranslations('portal.agencyHome');
  const portal = useTranslations('portal');
  const { isAgency, loading: authLoading, userData } = usePortalAuth();
  const canManagePricing = canAccessNav(userData?.agencyRole || 'owner', PERMISSIONS.MANAGE_PRICING);
  const canViewClients = canAccessNav(userData?.agencyRole || 'owner', PERMISSIONS.MANAGE_CLIENTS);
  const { requests, loading: requestsLoading, error: requestsError } = useRequests();
  const { data: organizations = [], isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ['studio-client-directory', userData?.id],
    queryFn: getAllOrganizations,
    enabled: !authLoading && isAgency && canViewClients,
    staleTime: 60_000,
  });
  const { openRequest } = useOpenRequest();
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['client-projects', 'all'],
    queryFn: () => listClientProjects(),
    enabled: !authLoading && isAgency,
    staleTime: 30_000,
  });

  const orgNames = useMemo(() => new Map(organizations.map(org => [org.id, org.name])), [organizations]);
  const attention = useMemo(() => requests.filter(request =>
    attentionStatuses.has(request.status) && request.requestRole !== 'bundle_item'
  ).sort((a, b) => priorityScore(b) - priorityScore(a) ||
    (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)
  ), [requests]);

  const waiting = requests.filter(request => waitingStatuses.has(request.status) && request.requestRole !== 'bundle_item').length;
  const activeProjects = projects.filter(project => activeProjectStatuses.has(project.status));
  const blockedProjects = activeProjects.filter(project => project.blockers?.some(blocker => !blocker.resolved));
  // Proposals are canonical portal requests, not a second collection.
  const openProposals = requests.filter(request =>
    Boolean(request.isBillable || request.publicToken || request.requestRole === 'bundle') &&
    ['DRAFT', 'QUOTED', 'CHANGES_REQUESTED', 'ACCEPTED'].includes(request.status)
  );
  const proposalStateLabels: Record<string, string> = {
    DRAFT: t('proposalState.DRAFT'),
    QUOTED: t('proposalState.QUOTED'),
    CHANGES_REQUESTED: t('proposalState.CHANGES_REQUESTED'),
    ACCEPTED: t('proposalState.ACCEPTED'),
  };
  const loading = authLoading || requestsLoading || clientsLoading || projectsLoading;

  if (!authLoading && !isAgency) return <p className="p-8 text-surface-600 dark:text-surface-300">{portal('access.restrictedMessage')}</p>;

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title={t('title')}
        description={t('subtitle')}
        className="mb-0"
        action={
          <div className="flex flex-wrap gap-2">
            {canManagePricing && <Link href={getPortalPath('/requests/new/?mode=quote')} className="portal-focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-200 px-4 text-sm font-semibold text-surface-800 hover:bg-surface-100 dark:border-surface-700 dark:text-white dark:hover:bg-surface-800">
              <FileText size={16} /> {t('newProposal')}
            </Link>}
            <Link href={getPortalPath('/requests/new/')} className="portal-focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700">
              <Plus size={16} /> {t('newRequest')}
            </Link>
          </div>
        }
      />

      {(requestsError || projectsError || clientsError) && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-500/30 p-4 text-sm text-rose-600 dark:text-rose-300">
          <AlertCircle size={18} /> {t('partialError')}
        </div>
      )}

      <div aria-busy={loading} className={'grid grid-cols-2 gap-3 ' + (canManagePricing ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
        <PortalMetricCard icon={AlertCircle} label={t('attention')} value={loading ? '…' : attention.length} tone="warning" />
        <PortalMetricCard icon={FolderKanban} label={t('activeProjects')} value={loading ? '…' : activeProjects.length} tone="primary" />
        <PortalMetricCard icon={Clock3} label={t('waitingClient')} value={loading ? '…' : waiting} tone="neutral" />
        {canManagePricing && <PortalMetricCard icon={FileText} label={t('openProposals')} value={loading ? '…' : openProposals.length} tone="success" />}
      </div>

      <div className="grid gap-5 min-[1100px]:grid-cols-[minmax(0,1.55fr)_minmax(290px,1fr)]">
        <Card noPadding className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-surface-200 px-5 py-4 dark:border-surface-800">
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">{t('attentionTitle')}</h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">{t('attentionHint')}</p>
            </div>
            <Link href={getPortalPath('/requests/?focus=attention')} className="portal-focus-ring rounded-lg text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400">{t('viewAll')}</Link>
          </div>
          {attention.length === 0 ? (
            <div className="flex items-center gap-3 p-6 text-sm text-surface-600 dark:text-surface-300">
              <CheckCircle2 size={20} className="text-emerald-500" /> {loading ? t('loading') : t('noAttention')}
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {attention.slice(0, 7).map(request => (
                <button type="button" key={request.id} onClick={() => openRequest(request.id, { orgId: request.orgId })}
                  className="portal-focus-ring flex min-h-16 w-full items-center justify-between gap-3 px-5 py-3 text-start transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/40">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-primary-600 dark:text-primary-400">{orgNames.get(request.orgId) || t('clientFallback')}</p>
                    <p className="truncate text-sm font-semibold text-surface-900 dark:text-white">{request.title}</p>
                    <p className="mt-1 text-xs text-surface-500">{request.assignedToName || t('unassigned')}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(request.status)}>{portal(getStatusTranslationKey(request.status))}</Badge>
                </button>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card noPadding className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4 dark:border-surface-800">
              <h2 className="text-lg font-semibold">{t('projectsTitle')}</h2>
              <Link href={getPortalPath('/projects/')} className="portal-focus-ring rounded-lg text-sm font-semibold text-primary-600 dark:text-primary-400">{t('viewAll')}</Link>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {activeProjects.slice(0, 4).map(project => (
                <Link key={project.id} href={getPortalPath('/projects/' + project.id + '/')} className="portal-focus-ring block px-5 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/40">
                  <p className="text-xs text-surface-500 dark:text-surface-400">{orgNames.get(project.orgId) || t('clientFallback')}</p>
                  <p className="mt-1 text-sm font-semibold">{project.title}</p>
                  {project.nextStep && <p className="mt-1 line-clamp-2 text-xs text-surface-500">{t('nextStep')}: {project.nextStep}</p>}
                  {project.blockers?.some(blocker => !blocker.resolved) && <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">{t('blocked')}</p>}
                </Link>
              ))}
              {activeProjects.length === 0 && <p className="p-5 text-sm text-surface-500">{loading ? t('loading') : t('noProjects')}</p>}
            </div>
          </Card>
          {canManagePricing && <Card noPadding className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-200 px-5 py-4 dark:border-surface-800">
              <h2 className="text-lg font-semibold">{t('proposalsTitle')}</h2>
              <Link href={getPortalPath('/requests/?focus=proposals')} className="portal-focus-ring rounded-lg text-sm font-semibold text-primary-600 dark:text-primary-400">{t('viewAll')}</Link>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {openProposals.slice(0, 4).map(proposal => (
                <Link key={proposal.id} href={getPortalPath('/requests/' + proposal.id + '/')} className="portal-focus-ring flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/40">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-surface-500">{orgNames.get(proposal.orgId) || t('clientFallback')}</p>
                    <p className="truncate text-sm font-semibold">{proposal.title}</p>
                  </div>
                  <span className="shrink-0 text-xs text-surface-500">{proposalStateLabels[proposal.status] || proposal.status}</span>
                </Link>
              ))}
              {openProposals.length === 0 && <p className="p-5 text-sm text-surface-500">{loading ? t('loading') : t('noProposals')}</p>}
            </div>
          </Card>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: '/agency/workboard/', icon: ClipboardList, label: t('workboard') },
          { href: '/agency/clients/', icon: Users, label: t('clients') },
          { href: '/agency/sales/', icon: ArrowUpRight, label: t('sales') },
        ].map(item => (
          <Link key={item.href} href={getPortalPath(item.href)} className="portal-focus-ring flex min-h-12 items-center gap-3 rounded-xl border border-surface-200 bg-white px-4 text-sm font-semibold transition-colors hover:border-primary-400 dark:border-surface-800 dark:bg-surface-900 dark:hover:border-primary-500">
            <item.icon size={18} className="text-primary-500" /> {item.label}
          </Link>
        ))}
      </div>
      {blockedProjects.length > 0 && <p className="text-xs text-surface-500">{t('blockersSummary', { count: blockedProjects.length })}</p>}
    </div>
  );
}
