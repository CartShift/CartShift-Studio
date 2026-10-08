'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { FolderKanban, Plus, ArrowUpRight, Loader2, Search } from 'lucide-react';
import { useRouter, Link } from '@/i18n/navigation';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { useAgencyClients } from '@/lib/hooks/useAgencyClients';
import { createClientProject, listClientProjects } from '@/lib/services/portal-projects';
import { PROJECT_STATUS_LABELS, type ProjectTemplate } from '@/lib/types/project';
import { PROJECT_TEMPLATES } from '@/lib/utils/project-workflow';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { toast } from 'sonner';

export default function ProjectsListClient() {
  const t = useTranslations('portal.projects');
  const locale = useLocale();
  const router = useRouter();
  const cache = useQueryClient();
  const { isAgency, loading: authLoading } = usePortalAuth();
  const orgId = useResolvedOrgId();
  const { organizations } = useAgencyClients();
  const [filter, setFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [template, setTemplate] = useState<ProjectTemplate>('shopify_theme');
  const [creating, setCreating] = useState(false);
  const scope = isAgency ? 'all' : orgId;
  const enabled = !authLoading && (isAgency || Boolean(orgId));
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['client-projects', scope],
    queryFn: () => listClientProjects(isAgency ? undefined : orgId!),
    enabled,
    staleTime: 30_000,
  });
  const visible = projects.filter(p => {
    if (isAgency && clientFilter !== 'all' && p.orgId !== clientFilter) return false;
    return (p.title + ' ' + p.summary).toLocaleLowerCase().includes(filter.toLocaleLowerCase());
  });
  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !selectedOrg || creating) return;
    setCreating(true);
    try {
      const id = await createClientProject({ title, orgId: selectedOrg, template, locale: locale === 'he' ? 'he' : 'en' });
      await cache.invalidateQueries({ queryKey: ['client-projects'] });
      setShowCreate(false);
      setTitle('');
      router.push(getPortalPath('/projects/' + id + '/'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveError'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="space-y-6 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">CartShift Studio</p>
          <h1 className="mt-2 text-3xl font-bold text-surface-950 dark:text-white">{t('title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-surface-600 dark:text-surface-400">{t('intro')}</p>
        </div>
        {isAgency && (
          <button type="button" onClick={() => setShowCreate(!showCreate)}
            className="portal-focus-ring flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700">
            <Plus size={17} />{t('newProject')}
          </button>
        )}
      </header>
      {isAgency && showCreate && (
        <form onSubmit={create} className="rounded-2xl border border-primary-200 bg-primary-50/40 p-5 dark:border-primary-800 dark:bg-primary-900/10">
          <h2 className="mb-4 font-semibold">{t('newProject')}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">{t('projectName')}
              <input autoFocus required maxLength={120} value={title} onChange={e => setTitle(e.target.value)}
                className="portal-focus-ring min-h-11 rounded-xl border border-surface-300 bg-white px-3 text-surface-900 dark:border-surface-700 dark:bg-surface-900 dark:text-white" />
            </label>
            <label className="grid gap-2 text-sm font-medium">{t('client')}
              <select required value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}
                className="portal-focus-ring min-h-11 rounded-xl border border-surface-300 bg-white px-3 text-surface-900 dark:border-surface-700 dark:bg-surface-900 dark:text-white">
                <option value="">{t('selectClient')}</option>
                {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">{t('template')}
              <select value={template} onChange={e => setTemplate(e.target.value as ProjectTemplate)}
                className="portal-focus-ring min-h-11 rounded-xl border border-surface-300 bg-white px-3 text-surface-900 dark:border-surface-700 dark:bg-surface-900 dark:text-white">
                {(Object.keys(PROJECT_TEMPLATES) as ProjectTemplate[]).map(k =>
                  <option value={k} key={k}>{PROJECT_TEMPLATES[k][locale === 'he' ? 'he' : 'en']}</option>)}
              </select>
            </label>
          </div>
          <button disabled={creating} className="portal-focus-ring mt-4 min-h-10 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white disabled:opacity-50">
            {creating ? t('saving') : t('create')}
          </button>
        </form>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search size={17} className="absolute start-3 top-3 text-surface-400" />
          <input aria-label={t('search')} value={filter} onChange={e => setFilter(e.target.value)}
            placeholder={t('search')} className="portal-focus-ring min-h-11 w-full rounded-xl border border-surface-200 bg-white pe-3 ps-10 text-sm dark:border-surface-800 dark:bg-surface-900" />
        </label>
        {isAgency && <select aria-label={t('client')} value={clientFilter} onChange={e => setClientFilter(e.target.value)}
          className="portal-focus-ring min-h-11 rounded-xl border border-surface-200 bg-white px-3 text-sm dark:border-surface-800 dark:bg-surface-900">
          <option value="all">{t('allClients')}</option>
          {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
        </select>}
      </div>
      {(authLoading || isLoading) ? <div className="flex items-center gap-3 py-16 text-surface-500"><Loader2 className="animate-spin" />{t('loading')}</div>
        : error ? <p role="alert" className="text-red-600">{t('loadError')}</p>
        : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-300 px-6 py-16 text-center dark:border-surface-700">
            <FolderKanban className="mx-auto mb-4 text-surface-400" size={32} />
            <h2 className="font-semibold">{t('noProjects')}</h2>
            <p className="mt-2 text-sm text-surface-500">{t('emptyHint')}</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {visible.map(p => {
              const activeBlockers = p.blockers.filter(item => !item.resolved).length;
              const completed = p.stages.filter(item => item.status === 'completed').length;
              return (
                <Link key={p.id} href={getPortalPath('/projects/' + p.id + '/')}
                  className="portal-focus-ring group rounded-2xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-surface-800 dark:bg-surface-900 dark:hover:border-primary-700">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"><FolderKanban size={18}/></span>
                    <ArrowUpRight size={18} className="text-surface-400 group-hover:text-primary-600" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold">{p.title}</h2>
                  {isAgency && <p className="mt-1 text-xs text-surface-500">{organizations.find(o => o.id === p.orgId)?.name || t('client')}</p>}
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-surface-600 dark:text-surface-400">{p.summary || t('noSummary')}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-surface-100 pt-4 text-xs dark:border-surface-800">
                    <span className="font-semibold text-primary-600 dark:text-primary-400">{PROJECT_STATUS_LABELS[p.status]?.[locale === 'he' ? 'he' : 'en']}</span>
                    <span className="text-surface-500">{t('stagesProgress', { done: completed, total: p.stages.length })}</span>
                    {activeBlockers > 0 && <span className="text-amber-600">{t('blockersCount', { count: activeBlockers })}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
    </main>
  );
}
