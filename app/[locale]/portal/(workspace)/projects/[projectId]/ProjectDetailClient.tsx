'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import {
  ArrowLeft, ExternalLink, CheckCircle2, Circle, ShieldCheck, AlertTriangle,
  FileCheck2, ClipboardList, Clock, Plus, Copy, Loader2,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { getRequestsByOrg, updateRequest } from '@/lib/services/portal-requests';
import {
  addProjectItem, editProjectItem, getClientProject, listProjectReviews,
  observeClientProject, submitProjectReview, updateClientProject,
} from '@/lib/services/portal-projects';
import {
  PROJECT_STATUS_LABELS,
  type ClientProject, type ProjectReview, type ProjectReviewDecision,
  type ProjectStatus, type ProjectScope, type ProjectCollectionField,
  type ProjectCollectionItem,
} from '@/lib/types/project';
import { getProjectHealth, loggedHours, projectBudget } from '@/lib/utils/project-workflow';
import { toast } from 'sonner';

function AddItem({ label, placeholder, onAdd, disabled }: {
  label: string; placeholder: string;
  onAdd: (title: string) => Promise<void>; disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  return <form className="mt-4 flex gap-2" onSubmit={async e => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    try { await onAdd(text.trim()); setText(''); }
    finally { setBusy(false); }
  }}>
    <input aria-label={placeholder} value={text} maxLength={180} disabled={disabled || busy}
      onChange={e => setText(e.target.value)} placeholder={placeholder}
      className="portal-focus-ring min-h-10 min-w-0 flex-1 rounded-xl border border-surface-200 bg-transparent px-3 text-sm dark:border-surface-700" />
    <button type="submit" disabled={busy || disabled || !text.trim()}
      className="portal-focus-ring flex min-h-10 items-center gap-1.5 rounded-xl bg-primary-600 px-3 text-sm font-semibold text-white disabled:opacity-50">
      {busy ? <Loader2 size={15} className="animate-spin"/> : <Plus size={15}/>}
      <span className="hidden sm:inline">{label}</span>
    </button>
  </form>;
}

function Panel({ title, children, icon: Icon }: {
  title: string; children: React.ReactNode; icon: typeof Clock;
}) {
  return <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
      <Icon size={19} className="text-primary-600 dark:text-primary-400" />{title}
    </h2>
    {children}
  </section>;
}

function ReviewRow({ project, deliverable, reviews, canReview, onReviewed }: {
  project: ClientProject;
  deliverable: ClientProject['deliverables'][number];
  reviews: ProjectReview[];
  canReview: boolean;
  onReviewed: () => Promise<unknown>;
}) {
  const t = useTranslations('portal.projects');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const relevant = reviews.filter(item =>
    item.deliverableId === deliverable.id && item.revision === deliverable.revision
  );
  const approved = relevant.length > 0 && relevant.every(item => item.decision === 'approved');
  const changed = relevant.some(item => item.decision === 'changes_requested');
  const safeUrl = (() => {
    if (!deliverable.previewUrl) return null;
    try {
      const u = new URL(deliverable.previewUrl);
      return ['http:', 'https:'].includes(u.protocol) ? u.toString() : null;
    } catch { return null; }
  })();
  const submit = async (decision: ProjectReviewDecision) => {
    if (busy) return;
    setBusy(true);
    try {
      await submitProjectReview({
        project, deliverableId: deliverable.id, revision: deliverable.revision,
        decision, comment,
      });
      await onReviewed();
      setComment('');
      toast.success(t('reviewSaved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveError'));
    } finally { setBusy(false); }
  };
  return (
    <div className="border-b border-surface-100 py-4 last:border-0 dark:border-surface-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">{deliverable.title}</h3>
          <p className="text-xs text-surface-500">{t('revision', { number: deliverable.revision })}</p>
        </div>
        <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + (changed
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
          : approved ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300')}>
          {changed ? t('changesRequested') : approved ? t('approved') : t('awaitingReview')}
        </span>
      </div>
      {safeUrl && <a className="portal-focus-ring mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 underline-offset-4 hover:underline dark:text-primary-400"
        href={safeUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/>{t('openPreview')}</a>}
      {relevant.filter(item => item.comment).map(item => <p key={item.id} className="mt-2 rounded-lg bg-surface-50 p-3 text-sm dark:bg-surface-800">{item.comment}</p>)}
      {canReview && <div className="mt-3 space-y-2">
        <textarea aria-label={t('reviewComment')} value={comment} maxLength={3000}
          onChange={e => setComment(e.target.value)} placeholder={t('reviewComment')}
          className="portal-focus-ring min-h-16 w-full rounded-xl border border-surface-200 bg-transparent p-3 text-sm dark:border-surface-700"/>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => submit('approved')}
            className="portal-focus-ring rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {t('approve')}
          </button>
          <button type="button" disabled={busy || !comment.trim()} onClick={() => submit('changes_requested')}
            className="portal-focus-ring rounded-lg border border-amber-400 px-3 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50 dark:text-amber-300">
            {t('requestChanges')}
          </button>
        </div>
      </div>}
    </div>
  );
}

function ScopeEditor({ project, save }: {
  project: ClientProject; save: (scope: ProjectScope) => Promise<void>;
}) {
  const t = useTranslations('portal.projects');
  const [draft, setDraft] = useState<ProjectScope>(project.scope);
  const [busy, setBusy] = useState(false);
  const change = (key: keyof ProjectScope, value: string) =>
    setDraft(prev => ({ ...prev, [key]: key === 'currency' ? value : Number(value) }));
  return <form onSubmit={async e => {
    e.preventDefault();
    if (busy) return;
    if (draft.minHours < 0 || draft.maxHours < draft.minHours || draft.rateCents < 0) {
      toast.error(t('invalidScope')); return;
    }
    setBusy(true);
    try { await save(draft); } finally { setBusy(false); }
  }} className="mt-4 grid gap-3 sm:grid-cols-2">
    <label className="grid gap-1.5 text-xs font-semibold">{t('minHours')}
      <input type="number" min="0" step="0.25" value={draft.minHours} onChange={e => change('minHours', e.target.value)}
        className="portal-focus-ring min-h-10 rounded-xl border border-surface-200 bg-transparent px-3 dark:border-surface-700"/>
    </label>
    <label className="grid gap-1.5 text-xs font-semibold">{t('maxHours')}
      <input type="number" min="0" step="0.25" value={draft.maxHours} onChange={e => change('maxHours', e.target.value)}
        className="portal-focus-ring min-h-10 rounded-xl border border-surface-200 bg-transparent px-3 dark:border-surface-700"/>
    </label>
    <label className="grid gap-1.5 text-xs font-semibold">{t('hourlyRate')}
      <input type="number" min="0" step="0.01" value={draft.rateCents / 100}
        onChange={e => setDraft(prev => ({ ...prev, rateCents: Math.round(Number(e.target.value) * 100) }))}
        className="portal-focus-ring min-h-10 rounded-xl border border-surface-200 bg-transparent px-3 dark:border-surface-700"/>
    </label>
    <label className="grid gap-1.5 text-xs font-semibold">{t('currency')}
      <select value={draft.currency} onChange={e => change('currency', e.target.value)}
        className="portal-focus-ring min-h-10 rounded-xl border border-surface-200 bg-transparent px-3 dark:border-surface-700">
        <option value="ILS">ILS</option><option value="USD">USD</option><option value="EUR">EUR</option>
      </select>
    </label>
    <button disabled={busy} className="portal-focus-ring min-h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">
      {t('saveScope')}
    </button>
  </form>;
}

export default function ProjectDetailClient({ id }: { id: string }) {
  const t = useTranslations('portal.projects');
  const locale = useLocale();
  const cache = useQueryClient();
  const { isAgency, loading: authLoading, user } = usePortalAuth();
  const key = ['client-project', id];
  const { data: project, isLoading, error } = useQuery({
    queryKey: key, queryFn: () => getClientProject(id), enabled: !authLoading && Boolean(user),
    staleTime: 30_000,
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ['client-project-reviews', id],
    queryFn: () => listProjectReviews(id),
    enabled: Boolean(project),
    staleTime: 10_000,
  });
  const { data: requests = [] } = useQuery({
    queryKey: ['client-project-requests', project?.orgId],
    queryFn: () => getRequestsByOrg(project!.orgId),
    enabled: Boolean(project),
  });
  const linkedRequests = requests.filter(req => req.projectId === id);
  const [selectedRequest, setSelectedRequest] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [blockerOwner, setBlockerOwner] = useState<'agency' | 'client' | 'vendor'>('vendor');
  const [logHours, setLogHours] = useState('1');
  const [logNote, setLogNote] = useState('');
  const [updateText, setUpdateText] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [reviewUrl, setReviewUrl] = useState('');
  const [changeHours, setChangeHours] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    // Authentication is fully initialized before registering a real-time subscription.
    const stop = observeClientProject(id, value => cache.setQueryData(key, value),
      () => toast.error(t('loadError')));
    return () => stop();
  }, [authLoading, cache, id, t, user]);

  const refresh = async () => {
    await cache.invalidateQueries({ queryKey: key });
  };
  const refreshReviews = async () => cache.invalidateQueries({ queryKey: ['client-project-reviews', id] });
  const execute = async (operation: () => Promise<void>) => {
    if (saving) return;
    setSaving(true);
    try { await operation(); await refresh(); toast.success(t('saved')); }
    catch (err) { toast.error(err instanceof Error ? err.message : t('saveError')); }
    finally { setSaving(false); }
  };
  const append = async <K extends ProjectCollectionField>(field: K, item: ProjectCollectionItem[K]) =>
    execute(() => addProjectItem(id, field, item));
  const edit = async <K extends ProjectCollectionField>(
    field: K, itemId: string, transform: (item: ProjectCollectionItem[K]) => ProjectCollectionItem[K]
  ) => execute(() => editProjectItem(id, field, itemId, transform));
  const makeId = () => crypto.randomUUID();
  const health = useMemo(() => project ? getProjectHealth(project, reviews) : null, [project, reviews]);
  const hours = project ? loggedHours(project) : 0;
  const budget = project ? projectBudget(project) : { minCents: 0, maxCents: 0 };
  const money = (n: number) => new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US', {
    style: 'currency', currency: project?.scope.currency || 'ILS', maximumFractionDigits: 0,
  }).format(n / 100);

  if (authLoading || isLoading) return <div className="flex items-center gap-2 py-16 text-surface-500"><Loader2 className="animate-spin"/>{t('loading')}</div>;
  if (error || !project) return <p role="alert" className="p-8 text-red-600">{t('loadError')}</p>;

  return <main className="space-y-5 pb-20">
    <Link href={getPortalPath('/projects/')} className="portal-focus-ring inline-flex items-center gap-2 text-sm font-semibold text-surface-600 hover:text-primary-600 dark:text-surface-300">
      <ArrowLeft size={15} className="rtl:rotate-180"/>{t('backToProjects')}
    </Link>
    <header className="rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900">
      <p className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400">CartShift / {t('title')}</p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{project.title}</h1>
        {isAgency ? <select aria-label={t('status')} value={project.status} disabled={saving}
          onChange={e => {
            const next = e.target.value as ProjectStatus;
            if (next === 'ready_to_launch' && !health?.readyForLaunch) {
              toast.error(t('launchNotReady')); return;
            }
            void execute(() => updateClientProject(id, { status: next }));
          }}
          className="portal-focus-ring min-h-11 rounded-xl border border-surface-200 bg-white px-3 text-sm font-semibold dark:border-surface-700 dark:bg-surface-900">
          {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map(status =>
            <option key={status} value={status}>{PROJECT_STATUS_LABELS[status][locale === 'he' ? 'he' : 'en']}</option>)}
        </select> : <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
          {PROJECT_STATUS_LABELS[project.status]?.[locale === 'he' ? 'he' : 'en']}
        </span>}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-surface-600 dark:text-surface-300">{project.summary || t('noSummary')}</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800"><p className="text-xs text-surface-500">{t('progress')}</p><p className="text-xl font-bold">{health?.progress}%</p></div>
        <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800"><p className="text-xs text-surface-500">{t('openBlockers')}</p><p className="text-xl font-bold">{health?.openBlockers}</p></div>
        <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800"><p className="text-xs text-surface-500">{t('pendingApprovals')}</p><p className="text-xl font-bold">{health?.pendingReviews}</p></div>
      </div>
      <div className="mt-5 rounded-xl border-s-4 border-primary-500 bg-primary-50/50 p-4 dark:bg-primary-900/10">
        <p className="text-xs font-bold text-primary-700 dark:text-primary-300">{t('nextStep')}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm">{project.nextStep || t('nextStepEmpty')}</p>
        {isAgency && <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input maxLength={400} aria-label={t('nextStep')} value={nextStep ?? project.nextStep}
            onChange={e => setNextStep(e.target.value)} className="portal-focus-ring min-h-10 min-w-0 flex-1 rounded-xl border border-surface-200 bg-white px-3 text-sm dark:border-surface-700 dark:bg-surface-900"/>
          <button type="button" disabled={saving} onClick={() => void execute(async () => {
            await updateClientProject(id, { nextStep: nextStep ?? project.nextStep }); setNextStep(null);
          })} className="portal-focus-ring min-h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white">
            {t('save')}
          </button>
        </div>}
      </div>
      {isAgency && <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-primary-600">{t('editOverview')}</summary>
        <textarea aria-label={t('summary')} value={summary ?? project.summary} onChange={e => setSummary(e.target.value)}
          className="portal-focus-ring mt-3 min-h-24 w-full rounded-xl border border-surface-200 bg-transparent p-3 text-sm dark:border-surface-700"/>
        <button type="button" disabled={saving} onClick={() => void execute(async () => {
          await updateClientProject(id, { summary: summary ?? project.summary }); setSummary(null);
        })} className="portal-focus-ring mt-2 min-h-10 rounded-xl bg-primary-600 px-5 text-sm text-white">{t('save')}</button>
      </details>}
    </header>

    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title={t('milestones')} icon={ClipboardList}>
        <div className="space-y-3">
          {project.stages.map(stage => <div key={stage.id} className="flex items-start gap-3">
            {stage.status === 'completed' ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={19}/> : <Circle className="mt-0.5 shrink-0 text-surface-400" size={19}/>}
            <span className="min-w-0 flex-1 text-sm font-medium">{stage.title}</span>
            {isAgency && <select aria-label={stage.title} value={stage.status} disabled={saving}
              onChange={e => void edit('stages', stage.id, previous => ({
                ...previous, status: e.target.value as typeof stage.status,
              }))}
              className="portal-focus-ring max-w-36 rounded-lg border border-surface-200 bg-transparent px-2 py-1 text-xs dark:border-surface-700">
              <option value="pending">{t('pending')}</option>
              <option value="in_progress">{t('inProgress')}</option>
              <option value="completed">{t('completed')}</option>
            </select>}
          </div>)}
        </div>
        {isAgency && <AddItem label={t('add')} placeholder={t('newMilestone')} onAdd={title =>
          append('stages', { id: makeId(), title, status: 'pending' })}/>}
      </Panel>
      <Panel title={t('blockers')} icon={AlertTriangle}>
        {project.blockers.length === 0 && <p className="text-sm text-surface-500">{t('noBlockers')}</p>}
        <div className="space-y-3">
          {project.blockers.map(blocker => <div key={blocker.id}
            className="rounded-xl border border-surface-100 p-3 dark:border-surface-800">
            <div className="flex items-start gap-2">
              {blocker.resolved ? <CheckCircle2 size={18} className="shrink-0 text-emerald-600"/> : <AlertTriangle size={18} className="shrink-0 text-amber-600"/>}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{blocker.title}</p>
                <p className="mt-1 text-xs text-surface-500">{t(blocker.owner)}</p>
                {blocker.nextAction && <p className="mt-2 text-sm">{blocker.nextAction}</p>}
              </div>
              {isAgency && <button type="button" disabled={saving}
                onClick={() => void edit('blockers', blocker.id, old => ({ ...old, resolved: !old.resolved }))}
                className="portal-focus-ring rounded-lg border border-surface-200 px-2 py-1 text-xs dark:border-surface-700">
                {blocker.resolved ? t('reopen') : t('resolve')}
              </button>}
            </div>
          </div>)}
        </div>
        {isAgency && <>
          <div className="mt-4 flex items-center gap-2">
            <label className="text-xs font-semibold" htmlFor="blockerOwner">{t('responsibility')}</label>
            <select id="blockerOwner" value={blockerOwner} onChange={e => setBlockerOwner(e.target.value as typeof blockerOwner)}
              className="portal-focus-ring min-h-9 rounded-lg border border-surface-200 bg-transparent px-2 text-xs dark:border-surface-700">
              <option value="agency">{t('agency')}</option><option value="client">{t('client')}</option><option value="vendor">{t('vendor')}</option>
            </select>
          </div>
          <AddItem label={t('add')} placeholder={t('newBlocker')} onAdd={title => append('blockers', {
            id: makeId(), title, owner: blockerOwner, nextAction: '', resolved: false,
          })}/>
        </>}
      </Panel>

      <Panel title={t('reviewCenter')} icon={FileCheck2}>
        <p className="mb-2 text-sm text-surface-500">{t('reviewHelp')}</p>
        {project.deliverables.length === 0 && <p className="text-sm text-surface-500">{t('noDeliverables')}</p>}
        {project.deliverables.map(deliverable => <div key={deliverable.id}>
          <ReviewRow project={project} deliverable={deliverable} reviews={reviews} canReview={!isAgency}
            onReviewed={refreshReviews}/>
          {isAgency && <button type="button" disabled={saving}
            onClick={() => void edit('deliverables', deliverable.id, old => ({
              ...old, revision: old.revision + 1,
            }))} className="portal-focus-ring my-2 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-semibold dark:border-surface-700">
            {t('newRevision')}
          </button>}
        </div>)}
        {isAgency && <>
          <input aria-label={t('previewUrl')} value={reviewUrl} onChange={e => setReviewUrl(e.target.value)}
            placeholder={t('previewUrl')} className="portal-focus-ring mt-4 min-h-10 w-full rounded-xl border border-surface-200 bg-transparent px-3 text-sm dark:border-surface-700"/>
          <AddItem label={t('add')} placeholder={t('newDeliverable')} onAdd={async title => {
            const previewUrl = reviewUrl.trim();
            if (previewUrl) {
              try {
                const url = new URL(previewUrl);
                if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
              } catch { toast.error(t('invalidUrl')); return; }
            }
            await append('deliverables', { id: makeId(), title, previewUrl, revision: 1 });
            setReviewUrl('');
          }}/>
        </>}
      </Panel>

      <Panel title={t('clientInputs')} icon={ClipboardList}>
        {project.inputs.length === 0 && <p className="text-sm text-surface-500">{t('noInputs')}</p>}
        {project.inputs.map(input => <div key={input.id} className="mb-3 flex items-center gap-3 text-sm">
          {input.done ? <CheckCircle2 size={18} className="shrink-0 text-emerald-600"/> : <Circle size={18} className="shrink-0 text-surface-400"/>}
          <span className="flex-1">{input.title}</span>
          {isAgency && <button type="button" disabled={saving} onClick={() => void edit('inputs', input.id, old => ({ ...old, done: !old.done }))}
            className="portal-focus-ring rounded-lg border border-surface-200 px-2 py-1 text-xs dark:border-surface-700">{input.done ? t('reopen') : t('markReceived')}</button>}
        </div>)}
        {isAgency && <AddItem label={t('add')} placeholder={t('newInput')} onAdd={title =>
          append('inputs', { id: makeId(), title, done: false, required: true })}/>}
      </Panel>

      <Panel title={t('launchReadiness')} icon={ShieldCheck}>
        <div className={'mb-4 rounded-xl p-3 text-sm font-semibold ' + (health?.readyForLaunch
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
          : 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300')}>
          {health?.readyForLaunch ? t('launchReady') : t('launchNotReady')}
        </div>
        <p className="mb-4 text-xs text-surface-500">{t('launchExplanation')}</p>
        {project.launchChecks.map(item => <div key={item.id} className="mb-3 flex items-center gap-3 text-sm">
          {item.done ? <CheckCircle2 size={18} className="shrink-0 text-emerald-600"/> : <Circle size={18} className="shrink-0 text-surface-400"/>}
          <span className="min-w-0 flex-1">{item.title}</span>
          {isAgency && <button type="button" disabled={saving} onClick={() => void edit('launchChecks', item.id, old => ({ ...old, done: !old.done }))}
            className="portal-focus-ring rounded-lg border border-surface-200 px-2 py-1 text-xs dark:border-surface-700">{item.done ? t('reopen') : t('markPassed')}</button>}
        </div>)}
        {isAgency && <AddItem label={t('add')} placeholder={t('newLaunchCheck')} onAdd={title =>
          append('launchChecks', { id: makeId(), title, done: false, required: true })}/>}
      </Panel>

      <Panel title={t('scopeAndTime')} icon={Clock}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800">
            <p className="text-xs text-surface-500">{t('approvedBudget')}</p>
            <p className="mt-1 font-bold">{money(budget.minCents)} – {money(budget.maxCents)}</p>
          </div>
          <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800">
            <p className="text-xs text-surface-500">{t('loggedHours')}</p>
            <p className="mt-1 font-bold">{hours.toLocaleString(locale)}h / {project.scope.maxHours}h</p>
          </div>
        </div>
        {isAgency && <ScopeEditor key={project.id} project={project}
          save={scope => execute(() => updateClientProject(id, { scope }))}/>}
        {isAgency && <form onSubmit={e => {
          e.preventDefault();
          const value = Number(logHours);
          if (!Number.isFinite(value) || value <= 0 || value > 24) { toast.error(t('invalidHours')); return; }
          void append('workLogs', {
            id: makeId(), hours: value, note: logNote.trim(), createdAt: Date.now(),
          }).then(() => { setLogNote(''); });
        }} className="mt-5 space-y-2 border-t border-surface-100 pt-4 dark:border-surface-800">
          <h3 className="text-sm font-semibold">{t('logWork')}</h3>
          <div className="flex gap-2">
            <input aria-label={t('hours')} type="number" min="0.25" max="24" step="0.25" value={logHours} onChange={e => setLogHours(e.target.value)}
              className="portal-focus-ring min-h-10 w-24 rounded-xl border border-surface-200 bg-transparent px-3 text-sm dark:border-surface-700"/>
            <input aria-label={t('workNote')} value={logNote} maxLength={250} onChange={e => setLogNote(e.target.value)}
              placeholder={t('workNote')} className="portal-focus-ring min-h-10 min-w-0 flex-1 rounded-xl border border-surface-200 bg-transparent px-3 text-sm dark:border-surface-700"/>
            <button type="submit" disabled={saving} className="portal-focus-ring min-h-10 rounded-xl bg-primary-600 px-3 text-sm font-semibold text-white"><Plus size={16}/></button>
          </div>
        </form>}
        {project.workLogs.slice().reverse().slice(0,8).map(log => <div key={log.id} className="mt-3 flex justify-between gap-3 border-t border-surface-100 pt-3 text-xs dark:border-surface-800">
          <span>{log.note || t('workEntry')}</span><strong>{log.hours}h</strong>
        </div>)}
      </Panel>

      <Panel title={t('changeRequests')} icon={FileCheck2}>
        <p className="mb-3 text-sm text-surface-500">{t('changeRequestsHint')}</p>
        {project.changes.length === 0 && <p className="text-sm text-surface-500">{t('noChanges')}</p>}
        {project.changes.map(change => <div key={change.id} className="mb-3 rounded-xl border border-surface-200 p-3 dark:border-surface-800">
          <div className="flex justify-between gap-2">
            <span className="text-sm font-semibold">{change.title}</span>
            <span className="text-xs text-surface-500">{change.estimatedHours}h · {t(change.status)}</span>
          </div>
          <p className="mt-2 text-xs text-surface-500">{change.description}</p>
        </div>)}
        {isAgency && <>
          <div className="mt-4 flex gap-2">
            <input aria-label={t('changeHours')} type="number" min="0" step="0.25" value={changeHours} onChange={e => setChangeHours(e.target.value)}
              className="portal-focus-ring min-h-10 w-24 rounded-xl border border-surface-200 bg-transparent px-3 text-sm dark:border-surface-700"/>
            <input aria-label={t('changeDescription')} value={changeNote} maxLength={250} onChange={e => setChangeNote(e.target.value)}
              placeholder={t('changeDescription')} className="portal-focus-ring min-h-10 min-w-0 flex-1 rounded-xl border border-surface-200 bg-transparent px-3 text-sm dark:border-surface-700"/>
          </div>
          <AddItem label={t('add')} placeholder={t('newChange')} onAdd={async title => {
            const estimatedHours = Number(changeHours);
            if (!Number.isFinite(estimatedHours) || estimatedHours < 0) {
              toast.error(t('invalidHours')); return;
            }
            await append('changes', { id: makeId(), title, description: changeNote.trim(), estimatedHours, status: 'proposed' });
            setChangeNote('');
          }}/>
        </>}
      </Panel>

      <Panel title={t('linkedRequests')} icon={ClipboardList}>
        {linkedRequests.length === 0 && <p className="text-sm text-surface-500">{t('noLinkedRequests')}</p>}
        {linkedRequests.map(request => <div key={request.id} className="mb-2 flex items-center justify-between gap-3 rounded-xl bg-surface-50 p-3 text-sm dark:bg-surface-800">
          <span className="min-w-0 flex-1 truncate font-semibold">{request.title}</span>
          <span className="text-xs text-surface-500">{request.status.replaceAll('_', ' ')}</span>
          {isAgency && <button aria-label={t('unlink')} type="button" disabled={saving}
            onClick={() => void execute(async () => {
              await updateRequest(request.id, { projectId: null });
              await cache.invalidateQueries({ queryKey: ['client-project-requests'] });
            })} className="portal-focus-ring rounded-lg px-2 py-1 text-xs text-primary-600">{t('unlink')}</button>}
        </div>)}
        {isAgency && <div className="mt-4 flex gap-2">
          <select aria-label={t('attachRequest')} value={selectedRequest} onChange={e => setSelectedRequest(e.target.value)}
            className="portal-focus-ring min-h-10 min-w-0 flex-1 rounded-xl border border-surface-200 bg-transparent px-3 text-sm dark:border-surface-700">
            <option value="">{t('attachRequest')}</option>
            {requests.filter(req => !req.projectId).map(request => <option key={request.id} value={request.id}>{request.title}</option>)}
          </select>
          <button type="button" disabled={saving || !selectedRequest}
            onClick={() => void execute(async () => {
              await updateRequest(selectedRequest, { projectId: id });
              await cache.invalidateQueries({ queryKey: ['client-project-requests'] });
              setSelectedRequest('');
            })} className="portal-focus-ring min-h-10 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white disabled:opacity-50">
            {t('attach')}
          </button>
        </div>}
      </Panel>

      <Panel title={t('clientUpdates')} icon={FileCheck2}>
        <p className="mb-3 text-sm text-surface-500">{t('updatesHelp')}</p>
        {isAgency && <form onSubmit={e => {
          e.preventDefault();
          if (!updateText.trim()) return;
          void append('updates', { id: makeId(), text: updateText.trim(), createdAt: Date.now(), author: user?.displayName || 'CartShift Studio' })
            .then(() => setUpdateText(''));
        }} className="space-y-2">
          <textarea aria-label={t('newUpdate')} value={updateText} onChange={e => setUpdateText(e.target.value)}
            placeholder={t('newUpdate')} maxLength={4000}
            className="portal-focus-ring min-h-24 w-full rounded-xl border border-surface-200 bg-transparent p-3 text-sm dark:border-surface-700"/>
          <button disabled={saving || !updateText.trim()} className="portal-focus-ring rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {t('publishUpdate')}
          </button>
        </form>}
        {project.updates.length === 0 && <p className="mt-4 text-sm text-surface-500">{t('noUpdates')}</p>}
        {project.updates.slice().reverse().map(update => <article key={update.id} className="mt-4 border-t border-surface-100 pt-4 dark:border-surface-800">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-surface-500">{update.author} · {new Date(update.createdAt).toLocaleDateString(locale)}</p>
            <button type="button" aria-label={t('copyUpdate')} onClick={() => {
              void navigator.clipboard.writeText(update.text).then(() => toast.success(t('copied'))).catch(() => toast.error(t('saveError')));
            }} className="portal-focus-ring rounded-lg p-2 text-primary-600"><Copy size={15}/></button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{update.text}</p>
        </article>)}
      </Panel>
    </div>
  </main>;
}
