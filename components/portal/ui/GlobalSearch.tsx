'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Search, ClipboardList, Users, FolderKanban, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { canAccessNav, PERMISSIONS } from '@/lib/utils/permissions';
import { useRequests } from '@/lib/hooks/useRequests';
import { useOpenRequest } from '@/lib/hooks/useOpenRequest';
import { listClientProjects } from '@/lib/services/portal-projects';
import { getAllOrganizations } from '@/lib/services/portal-organizations';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { useRecentSearches } from '@/lib/hooks/useRecentSearches';
import { Input } from '@/components/ui/Input';
import type { LucideIcon } from 'lucide-react';

interface GlobalSearchProps { orgId?: string; isAgency?: boolean; className?: string; onSelect?: () => void }
type Result = { id: string; title: string; description: string; type: 'request' | 'client' | 'project' | 'proposal'; href: string; orgId?: string; icon: LucideIcon };

export function GlobalSearch({ isAgency = false, className, onSelect }: GlobalSearchProps) {
  const t = useTranslations('portal.globalSearch');
  const router = useRouter();
  const { loading: authLoading, isAuthenticated, userData } = usePortalAuth();
  const { requests } = useRequests();
  const { openRequest } = useOpenRequest();
  const { recentSearches, addSearch, clearSearches } = useRecentSearches();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const term = query.trim().toLocaleLowerCase();
  const loadAgency = isAgency && isAuthenticated && !authLoading && isOpen && term.length >= 2;
  const canViewClients = isAgency && canAccessNav(userData?.agencyRole || 'owner', PERMISSIONS.MANAGE_CLIENTS);
  const canViewCommercial = isAgency && canAccessNav(userData?.agencyRole || 'owner', PERMISSIONS.MANAGE_PRICING);
  const { data: clients = [], isFetching: loadingClients } = useQuery({
    queryKey: ['studio-client-directory', userData?.id], queryFn: getAllOrganizations, enabled: loadAgency && canViewClients, staleTime: 60_000,
  });
  const { data: projects = [], isFetching: loadingProjects } = useQuery({
    queryKey: ['portal-search', 'projects', user?.uid], queryFn: () => listClientProjects(), enabled: loadAgency, staleTime: 30_000,
  });
  const pending = loadAgency && ((canViewClients && loadingClients) || loadingProjects);

  const results = useMemo<Result[]>(() => {
    if (!term) return [];
    const matches = (value?: string) => (value || '').toLocaleLowerCase().includes(term);
    const requestMatches: Result[] = requests.filter(request =>
      (!isAgency || !(request.isBillable || request.publicToken || request.requestRole === 'bundle')) &&
      (matches(request.title) || matches(request.id) || matches(request.description))
    ).slice(0, 5).map(request => ({
      id: 'request-' + request.id, title: request.title, description: t('request'),
      type: 'request', orgId: request.orgId, href: request.id, icon: ClipboardList,
    }));
    if (!isAgency) return requestMatches;
    return [
      ...clients.filter(client => canViewClients && (matches(client.name) || matches(client.website))).slice(0, 4).map(client => ({
        id: 'client-' + client.id, title: client.name, description: t('client'),
        type: 'client' as const, href: getPortalPath('/agency/clients/' + client.id + '/'), icon: Users,
      })),
      ...projects.filter(project => matches(project.title) || matches(project.summary) || matches(clients.find(c => c.id === project.orgId)?.name)).slice(0, 4).map(project => ({
        id: 'project-' + project.id, title: project.title, description: t('project'),
        type: 'project' as const, href: getPortalPath('/projects/' + project.id + '/'), icon: FolderKanban,
      })),
      ...requestMatches,
      ...requests.filter(proposal => canViewCommercial && Boolean(proposal.isBillable || proposal.publicToken || proposal.requestRole === 'bundle') && (matches(proposal.title) || matches(proposal.description) || matches(clients.find(c => c.id === proposal.orgId)?.name))).slice(0, 4).map(proposal => ({
        id: 'proposal-' + proposal.id, title: proposal.title, description: t('proposal'),
        type: 'proposal' as const, href: getPortalPath('/requests/' + proposal.id + '/'), icon: FileText,
      })),
    ].slice(0, 14);
  }, [term, requests, isAgency, clients, projects, t, canViewClients, canViewCommercial]);

  useEffect(() => setActiveIndex(0), [term]);
  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const openResult = (result: Result) => {
    if (term) addSearch(query.trim());
    setQuery('');
    setIsOpen(false);
    onSelect?.();
    if (result.type === 'request') openRequest(result.href, { orgId: result.orgId });
    else router.push(result.href);
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Input ref={inputRef} type="search" aria-label={t('search')} aria-expanded={isOpen && Boolean(term)}
        aria-controls="portal-global-search-results" value={query}
        onChange={event => { setQuery(event.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={event => {
          if (event.key === 'Escape') { setIsOpen(false); inputRef.current?.blur(); }
          if (!isOpen || results.length === 0) return;
          if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex(index => (index + 1) % results.length); }
          if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(index => (index - 1 + results.length) % results.length); }
          if (event.key === 'Enter') { event.preventDefault(); openResult(results[activeIndex] || results[0]); }
        }}
        placeholder={t('search')} leftIcon={<Search size={18} className="text-surface-400" />} className="min-h-11"
      />
      {isOpen && (
        <div id="portal-global-search-results" role="region" aria-label={t('results')}
          className="absolute inset-x-0 top-full z-[70] mt-2 max-h-[min(60vh,440px)] overflow-y-auto rounded-2xl border border-surface-200 bg-white p-2 shadow-2xl dark:border-surface-700 dark:bg-surface-900">
          {term ? <>
            {results.map((result, index) => {
              const Icon = result.icon;
              return (
                <button key={result.id} type="button" onClick={() => openResult(result)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn('portal-focus-ring flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-start',
                    activeIndex === index ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-surface-50 dark:hover:bg-surface-800')}>
                  <Icon size={18} aria-hidden className="shrink-0 text-primary-600 dark:text-primary-400" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{result.title}</span>
                    <span className="block text-xs text-surface-500 dark:text-surface-400">{result.description}</span></span>
                </button>
              );
            })}
            {pending && <p role="status" className="flex items-center gap-2 px-3 py-3 text-xs text-surface-500"><Loader2 size={14} className="animate-spin" /> {t('loading')}</p>}
            {!pending && results.length === 0 && <p className="px-3 py-5 text-sm text-surface-500">{t('empty')}</p>}
            {isAgency && term.length < 2 && <p className="px-3 py-3 text-xs text-surface-500">{t('hint')}</p>}
          </> : <>
            <div className="flex items-center justify-between px-3 py-2 text-xs text-surface-500"><span>{t('recent')}</span>
              {recentSearches.length > 0 && <button type="button" onClick={clearSearches} className="portal-focus-ring rounded p-1 hover:underline">{t('clear')}</button>}</div>
            {recentSearches.slice(0, 5).map(history => (
              <button key={history} type="button" onClick={() => setQuery(history)}
                className="portal-focus-ring flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-start text-sm hover:bg-surface-50 dark:hover:bg-surface-800">
                <Search size={14} className="text-surface-400" /> {history}
              </button>
            ))}
            {recentSearches.length === 0 && <p className="px-3 py-4 text-sm text-surface-500">{t('hint')}</p>}
          </>}
        </div>
      )}
    </div>
  );
}
