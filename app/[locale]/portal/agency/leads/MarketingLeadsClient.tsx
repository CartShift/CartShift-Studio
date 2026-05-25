'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Clock,
  Mail,
  MousePointerClick,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useMarketingDashboard } from '@/lib/hooks/useMarketingDashboard';
import type { MarketingLead } from '@/lib/services/portal-marketing';

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

export default function MarketingLeadsClient() {
  const t = useTranslations('portal.marketing');
  const { dashboard, loading, error, refetch } = useMarketingDashboard();
  const [search, setSearch] = useState('');

  const filteredLeads = useMemo(() => {
    const leads = dashboard?.leads || [];
    const term = search.trim().toLowerCase();
    if (!term) return leads;

    return leads.filter(lead =>
      [lead.email, lead.name, lead.company, lead.storeUrl, lead.platform, lead.latestSource]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term))
    );
  }, [dashboard?.leads, search]);

  const recentEvents = dashboard?.events.slice(0, 8) || [];
  const recentJobs = dashboard?.jobs.slice(0, 8) || [];

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
          {
            label: t('metrics.totalLeads'),
            value: dashboard?.metrics.totalLeads || 0,
            icon: Users,
          },
          {
            label: t('metrics.hotLeads'),
            value: dashboard?.metrics.hotLeads || 0,
            icon: TrendingUp,
          },
          {
            label: t('metrics.pendingEmails'),
            value: dashboard?.metrics.pendingEmails || 0,
            icon: Clock,
          },
          {
            label: t('metrics.avgScore'),
            value: dashboard?.metrics.averageLeadScore || 0,
            icon: Activity,
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card padding="none">
          <div className="border-b border-surface-200 p-5 dark:border-white/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                {t('leads.title')}
              </h2>
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder={t('leads.search')}
                leftIcon={<Search className="h-4 w-4 text-surface-400" />}
                className="md:max-w-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-start">
              <thead>
                <tr className="border-b border-surface-200 text-xs uppercase tracking-widest text-surface-500 dark:border-white/10">
                  <th className="px-5 py-3 text-start">{t('leads.lead')}</th>
                  <th className="px-5 py-3 text-start">{t('leads.source')}</th>
                  <th className="px-5 py-3 text-start">{t('leads.stage')}</th>
                  <th className="px-5 py-3 text-start">{t('leads.score')}</th>
                  <th className="px-5 py-3 text-start">{t('leads.email')}</th>
                  <th className="px-5 py-3 text-start">{t('leads.updated')}</th>
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
                    <td className="px-5 py-4 capitalize">
                      {lead.lastEmailStepId || t('leads.none')}
                    </td>
                    <td className="px-5 py-4">{formatDate(lead.updatedAt)}</td>
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
    </div>
  );
}
