'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { FolderKanban, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { listClientProjects } from '@/lib/services/portal-projects';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { PROJECT_STATUS_LABELS } from '@/lib/types/project';

export function ProjectHighlights() {
  const t = useTranslations('portal.projects');
  const locale = useLocale();
  const orgId = useResolvedOrgId();
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['client-projects', orgId],
    queryFn: () => listClientProjects(orgId!),
    enabled: Boolean(orgId),
    staleTime: 30_000,
  });
  if (!orgId || isLoading || projects.length === 0) return null;
  const active = projects.filter(p => !['completed', 'archived'].includes(p.status));
  if (!active.length) return null;
  return (
    <section aria-label={t('title')} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold"><FolderKanban size={19} className="text-primary-600"/>{t('title')}</h2>
        <Link className="portal-focus-ring text-sm font-semibold text-primary-600 dark:text-primary-400"
          href={getPortalPath('/projects/')}>{t('viewAll')}</Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {active.slice(0, 2).map(project => {
          const blockers = project.blockers.filter(item => !item.resolved).length;
          return (
            <Link href={getPortalPath('/projects/' + project.id + '/')} key={project.id}
              className="portal-focus-ring group rounded-2xl border border-surface-200 bg-white p-4 transition-colors hover:border-primary-300 dark:border-surface-800 dark:bg-surface-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">{PROJECT_STATUS_LABELS[project.status]?.[locale === 'he' ? 'he' : 'en']}</p>
                  <h3 className="mt-1 font-bold">{project.title}</h3>
                </div>
                <ArrowUpRight size={17} className="text-surface-400 group-hover:text-primary-500"/>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-surface-600 dark:text-surface-300">{project.nextStep || t('nextStepEmpty')}</p>
              {blockers > 0 && <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400"><AlertTriangle size={14}/>{t('blockersCount',{count:blockers})}</p>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
