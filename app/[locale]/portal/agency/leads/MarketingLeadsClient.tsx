'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Check,
  Clock,
  Copy,
  Mail,
  MousePointerClick,
  RefreshCw,
  Search,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useMarketingDashboard } from '@/lib/hooks/useMarketingDashboard';
import { useUpdateMarketingLead } from '@/lib/hooks/useUpdateMarketingLead';
import { useAgencyClients } from '@/lib/hooks/useAgencyClients';
import { LeadInviteModal } from '@/components/portal/marketing/LeadInviteModal';
import { generateGoogleCalendarEventLink } from '@/lib/schedule';
import { getScheduleUrl } from '@/lib/schedule';
import type { MarketingLead } from '@/lib/services/portal-marketing';

type LeadFilter = 'all' | 'hot' | 'needsFollowUp';

function formatDate(value: MarketingLead['updatedAt']) {
  if (!value) return '—';
  return value.toDate().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSource(source?: string) {
  return source ? source.replace(/_/g, ' ') : 'unknown';
}

function getScoreTone(score?: number) {
  if ((score || 0) >= 60) return 'green';
  if ((score || 0) >= 25) return 'yellow';
  return 'gray';
}

function buildMailto(lead: MarketingLead) {
  const subject = encodeURIComponent(`CartShift follow-up — ${lead.email}`);
  const body = encodeURIComponent(
    [
      `Lead: ${lead.email}`,
      lead.storeUrl ? `Store: ${lead.storeUrl}` : null,
      lead.overallScore != null ? `Analyzer score: ${lead.overallScore}/100` : null,
      lead.latestSource ? `Source: ${lead.latestSource}` : null,
    ]
      .filter(Boolean)
      .join('\n')
  );
  return `mailto:${lead.email}?subject=${subject}&body=${body}`;
}

function buildCalendarUrl(lead: MarketingLead) {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  return (
    generateGoogleCalendarEventLink({
      title: `CartShift call — ${lead.email}`,
      description: [
        `Lead email: ${lead.email}`,
        lead.storeUrl ? `Store: ${lead.storeUrl}` : null,
        lead.overallScore != null ? `Score: ${lead.overallScore}/100` : null,
        lead.platform ? `Platform: ${lead.platform}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      startTime: start,
      endTime: end,
      attendeeEmails: [lead.email],
      addConferencing: true,
    }) || getScheduleUrl()
  );
}

function leadNeedsFollowUp(lead: MarketingLead) {
  if ((lead.leadScore || 0) < 50) return false;
  if (lead.contactStatus === 'contacted') return false;
  const updated = lead.updatedAt?.toMillis() || lead.createdAt?.toMillis() || 0;
  return updated <= Date.now() - 48 * 60 * 60 * 1000;
}

export default function MarketingLeadsClient() {
  const t = useTranslations('portal.marketing');
  const { dashboard, loading, error, refetch } = useMarketingDashboard();
  const { organizations } = useAgencyClients();
  const updateLead = useUpdateMarketingLead();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LeadFilter>('all');
  const [inviteLead, setInviteLead] = useState<MarketingLead | null>(null);

  const orgOptions = useMemo(
    () => organizations.map(org => ({ id: org.id, name: org.name })),
    [organizations]
  );

  const filteredLeads = useMemo(() => {
    const leads = dashboard?.leads || [];
    const term = search.trim().toLowerCase();

    return leads.filter(lead => {
      if (filter === 'hot' && (lead.leadScore || 0) < 50) return false;
      if (filter === 'needsFollowUp' && !leadNeedsFollowUp(lead)) return false;

      if (!term) return true;
      return [lead.email, lead.name, lead.company, lead.storeUrl, lead.platform, lead.latestSource]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term));
    });
  }, [dashboard?.leads, filter, search]);

  const recentEvents = dashboard?.events.slice(0, 8) || [];
  const recentJobs = dashboard?.jobs.slice(0, 8) || [];
  const sourceCounts = dashboard?.metrics.sourceCounts || {};
  const stageCounts = dashboard?.metrics.stageCounts || {};

  const handleCopyEmail = async (email: string) => {
    await navigator.clipboard.writeText(email);
    toast.success(t('actions.copied'));
  };

  const handleMarkContacted = (leadId: string) => {
    updateLead.mutate(
      { leadId, contactStatus: 'contacted' },
      {
        onSuccess: () => toast.success(t('actions.contacted')),
        onError: () => toast.error(t('errorTitle')),
      }
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4">
        <RefreshCw className="h-9 w-9 animate-spin text-primary-500" />
        <p className="text-xs font-bold uppercase tracking-widest text-surface-500">
          {t('loading')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Card padding="lg">
        <div className="flex items-start gap-4">
          <AlertCircle className="mt-1 h-6 w-6 text-red-500" />
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white">
              {t('errorTitle')}
            </h2>
            <p className="mt-1 text-sm text-surface-500">{error}</p>
            <Button className="mt-5" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="me-2 h-4 w-4" />
              {t('refresh')}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
              <Mail className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">
              {t('title')}
            </h1>
          </div>
          <p className="ms-[52px] text-sm text-surface-500 dark:text-surface-400">
            {t('subtitle')}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="me-2 h-4 w-4" />
          {t('refresh')}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t('metrics.totalLeads'), value: dashboard?.metrics.totalLeads || 0, icon: Users },
          { label: t('metrics.hotLeads'), value: dashboard?.metrics.hotLeads || 0, icon: TrendingUp },
          {
            label: t('metrics.leads7d'),
            value: dashboard?.metrics.leadsLast7Days || 0,
            icon: Activity,
          },
          {
            label: t('metrics.needsFollowUp'),
            value: dashboard?.metrics.needsFollowUp || 0,
            icon: Clock,
          },
        ].map(metric => (
          <Card key={metric.label} padding="default">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-surface-500">
                  {metric.label}
                </p>
                <p className="mt-2 text-3xl font-black text-surface-900 dark:text-white">
                  {metric.value}
                </p>
              </div>
              <metric.icon className="h-7 w-7 text-primary-500" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="default">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-surface-500">
            {t('funnel.bySource')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(sourceCounts).map(([source, count]) => (
              <Badge key={source} variant="gray">
                {formatSource(source)}: {count}
              </Badge>
            ))}
            {Object.keys(sourceCounts).length === 0 && (
              <p className="text-sm text-surface-500">{t('leads.empty')}</p>
            )}
          </div>
        </Card>
        <Card padding="default">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-surface-500">
            {t('funnel.byStage')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stageCounts).map(([stage, count]) => (
              <Badge key={stage} variant="gray">
                {formatSource(stage)}: {count}
              </Badge>
            ))}
            {Object.keys(stageCounts).length === 0 && (
              <p className="text-sm text-surface-500">{t('leads.empty')}</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card padding="none">
          <div className="border-b border-surface-200 p-5 dark:border-white/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                {t('leads.title')}
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-wrap gap-2">
                  {(['all', 'hot', 'needsFollowUp'] as LeadFilter[]).map(value => (
                    <Button
                      key={value}
                      size="sm"
                      variant={filter === value ? 'primary' : 'outline'}
                      onClick={() => setFilter(value)}
                    >
                      {t(`filters.${value}`)}
                    </Button>
                  ))}
                </div>
                <Input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder={t('leads.search')}
                  leftIcon={<Search className="h-4 w-4 text-surface-400" />}
                  className="md:max-w-xs"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-start">
              <thead>
                <tr className="border-b border-surface-200 text-xs uppercase tracking-widest text-surface-500 dark:border-white/10">
                  <th className="px-5 py-3 text-start">{t('leads.lead')}</th>
                  <th className="px-5 py-3 text-start">{t('leads.source')}</th>
                  <th className="px-5 py-3 text-start">{t('leads.stage')}</th>
                  <th className="px-5 py-3 text-start">{t('leads.score')}</th>
                  <th className="px-5 py-3 text-start">{t('leads.updated')}</th>
                  <th className="px-5 py-3 text-start">{t('leads.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr
                    key={lead.leadId}
                    className="border-b border-surface-100 text-sm last:border-0 dark:border-white/5"
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-surface-900 dark:text-white">{lead.email}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-surface-500">
                        {lead.contactStatus === 'contacted' && (
                          <Badge variant="green">{t('leads.contacted')}</Badge>
                        )}
                        {lead.platform && <span>{lead.platform}</span>}
                        {lead.overallScore != null && <span>{lead.overallScore}/100</span>}
                        {lead.storeUrl && (
                          <a
                            href={lead.storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                          >
                            {t('leads.openStore')}
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 capitalize">{formatSource(lead.latestSource)}</td>
                    <td className="px-5 py-4">
                      <Badge variant="gray">{formatSource(lead.funnelStage)}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={getScoreTone(lead.leadScore)}>{lead.leadScore || 0}</Badge>
                    </td>
                    <td className="px-5 py-4">{formatDate(lead.updatedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          title={t('actions.copyEmail')}
                          onClick={() => handleCopyEmail(lead.email)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <a
                          href={buildMailto(lead)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-white/10"
                          title={t('actions.emailLead')}
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                        <a
                          href={buildCalendarUrl(lead)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-white/10"
                          title={t('actions.openCalendar')}
                        >
                          <Calendar className="h-4 w-4" />
                        </a>
                        {lead.contactStatus !== 'contacted' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title={t('actions.markContacted')}
                            disabled={updateLead.isPending}
                            onClick={() => handleMarkContacted(lead.leadId)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          title={t('actions.invite')}
                          onClick={() => setInviteLead(lead)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <div className="py-14 text-center text-sm text-surface-500">{t('leads.empty')}</div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card padding="default">
            <h2 className="mb-4 text-lg font-bold text-surface-900 dark:text-white">
              {t('jobs.title')}
            </h2>
            <div className="space-y-3">
              {recentJobs.map(job => (
                <div
                  key={job.id}
                  className="rounded-xl border border-surface-200 p-3 text-sm dark:border-white/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-surface-900 dark:text-white">{job.stepId}</span>
                    <Badge variant={job.status === 'failed' ? 'red' : 'gray'}>{job.status}</Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-surface-500">{job.email}</p>
                </div>
              ))}
              {recentJobs.length === 0 && (
                <p className="text-sm text-surface-500">{t('jobs.empty')}</p>
              )}
            </div>
          </Card>

          <Card padding="default">
            <h2 className="mb-4 text-lg font-bold text-surface-900 dark:text-white">
              {t('events.title')}
            </h2>
            <div className="space-y-3">
              {recentEvents.map(event => (
                <div key={event.id} className="flex items-start gap-3 text-sm">
                  <MousePointerClick className="mt-0.5 h-4 w-4 text-primary-500" />
                  <div className="min-w-0">
                    <p className="font-bold text-surface-900 dark:text-white">{event.type}</p>
                    <p className="truncate text-xs text-surface-500">
                      {event.ctaLocation || event.source || event.stepId || event.leadId}
                    </p>
                  </div>
                </div>
              ))}
              {recentEvents.length === 0 && (
                <p className="text-sm text-surface-500">{t('events.empty')}</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {inviteLead && (
        <LeadInviteModal
          lead={inviteLead}
          organizations={orgOptions}
          onClose={() => setInviteLead(null)}
        />
      )}
    </div>
  );
}
