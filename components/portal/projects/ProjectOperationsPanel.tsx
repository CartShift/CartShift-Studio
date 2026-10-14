'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock3, ExternalLink, FileCheck2, LockKeyhole, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { ClientProject } from '@/lib/types/project';
import type { Request } from '@/lib/types/portal';
import {
  PROJECT_RECORD_KINDS, projectCommercialSummary, validateProjectPrivateRecord,
  type NewProjectPrivateRecord, type ProjectPrivateRecord, type ProjectRecordKind,
  type ProjectRecordStatus,
} from '@/lib/domain/project-operations';
import {
  addProjectPrivateRecord, listProjectPrivateRecords, updateProjectPrivateRecordStatus,
} from '@/lib/services/portal-project-operations';

const labels: Record<ProjectRecordKind, { he: string; en: string }> = {
  decision: { he: 'החלטת לקוח', en: 'Client decision' },
  qa: { he: 'בדיקת QA', en: 'QA evidence' },
  dependency: { he: 'תלות בספק', en: 'Vendor dependency' },
  follow_up: { he: 'מעקב והמשך טיפול', en: 'Follow-up' },
  time: { he: 'רישום זמן פנימי', en: 'Private work log' },
};

const statuses: Record<ProjectRecordKind, ProjectRecordStatus[]> = {
  decision: ['open', 'confirmed'],
  qa: ['open', 'passed', 'failed'],
  dependency: ['open', 'done'],
  follow_up: ['open', 'done'],
  time: ['done'],
};
const statusText: Record<ProjectRecordStatus, { he: string; en: string }> = {
  open: { he: 'פתוח / ממתין', en: 'Open / pending' },
  confirmed: { he: 'אושר ותועד', en: 'Confirmed' },
  passed: { he: 'עבר', en: 'Passed' },
  failed: { he: 'נכשל', en: 'Failed' },
  done: { he: 'הושלם', en: 'Done' },
};

const inputClass = 'portal-focus-ring min-h-10 w-full rounded-xl border border-surface-200 bg-white px-3 text-sm dark:border-surface-700 dark:bg-surface-900';
const amount = (cents: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(cents / 100);

function FinanceOverview({ project, requests, locale }: {
  project: ClientProject; requests: Request[]; locale: string;
}) {
  const he = locale === 'he';
  const summary = projectCommercialSummary(requests, project.id);
  const hasQuotes = summary.proposalCount > 0;
  const currency = project.scope.currency || 'ILS';
  const scopeCap = Math.round(project.scope.maxHours * project.scope.rateCents);
  const due = summary.estimatedBalanceMinor;
  return <div className="grid gap-3 sm:grid-cols-3">
    <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800">
      <p className="text-xs text-surface-500">{he ? 'מסגרת הערכה' : 'Estimated project cap'}</p>
      <p className="mt-1 text-lg font-semibold">{scopeCap > 0 ? amount(scopeCap, currency, locale) : (he ? 'טרם הוגדרה' : 'Not set')}</p>
      <p className="mt-1 text-xs text-surface-500">{he ? 'לא סכום חיוב סופי' : 'Not a final invoice'}</p>
    </div>
    <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800">
      <p className="text-xs text-surface-500">{he ? 'נרשם כשולם במערכת' : 'Recorded paid in system'}</p>
      <p className="mt-1 text-lg font-semibold">{hasQuotes ? amount(summary.recordedPaidMinor, currency, locale) : '—'}</p>
      <p className="mt-1 text-xs text-surface-500">{he ? 'מתוך הצעות מקושרות בלבד' : 'Linked proposals only'}</p>
    </div>
    <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800">
      <p className="text-xs text-surface-500">{he ? 'יתרת מסגרת משוערת' : 'Estimated remaining cap'}</p>
      <p className="mt-1 text-lg font-semibold">{hasQuotes ? amount(due, currency, locale) : '—'}</p>
      <p className="mt-1 text-xs text-surface-500">{he ? 'יש להתאים לשעות ולתשלומים בפועל' : 'Reconcile with actual work and payments'}</p>
    </div>
    {hasQuotes && summary.reportedUnverifiedMinor > 0 && <p className="sm:col-span-3 text-xs text-amber-700 dark:text-amber-300">
      <AlertCircle size={14} className="me-1 inline"/>
      {he ? 'דווחה מקדמה שעדיין לא אומתה: ' : 'Reported, unverified deposit: '}
      {amount(summary.reportedUnverifiedMinor, currency, locale)}.
      {he ? ' לא נספרה כתשלום.' : ' Not counted as paid.'}
    </p>}
    {!hasQuotes && <p className="sm:col-span-3 text-xs text-amber-700 dark:text-amber-300">
      {he ? 'לא נמצאה הצעת מחיר מקושרת לפרויקט. יש לקשר את ההצעה הקיימת, ולא ליצור חיוב כפול.' :
        'No linked proposal was found. Link the existing quote instead of creating a duplicate charge.'}
    </p>}
  </div>;
}

function RecordRow({ record, projectId, locale, onSaved }: {
  record: ProjectPrivateRecord; projectId: string; locale: string;
  onSaved: () => Promise<unknown>;
}) {
  const [saving, setSaving] = useState(false);
  const he = locale === 'he';
  const statusOptions = statuses[record.kind];
  const date = record.createdAtMs;
  return <article className="rounded-xl border border-surface-200 p-3 dark:border-surface-700">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-surface-500">{labels[record.kind][he ? 'he' : 'en']}
          {date ? ' · ' + new Date(date).toLocaleDateString(he ? 'he-IL' : 'en-US') : ''}
        </p>
        <p className="mt-1 break-words text-sm font-semibold">{record.title}</p>
      </div>
      {record.kind === 'time' ? <span className="text-sm font-bold">{record.hours}h</span> :
        <select className={inputClass + ' w-auto max-w-full'} aria-label={he ? 'מצב הרשומה' : 'Record status'}
          disabled={saving} value={record.status}
          onChange={async e => {
            setSaving(true);
            try {
              await updateProjectPrivateRecordStatus(projectId, record, e.target.value as ProjectRecordStatus);
              await onSaved();
            } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to update'); }
            finally { setSaving(false); }
          }}>
          {statusOptions.map(value => <option value={value} key={value}>{statusText[value][he ? 'he' : 'en']}</option>)}
        </select>}
    </div>
    {record.details && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-surface-600 dark:text-surface-300">{record.details}</p>}
    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-surface-500">
      {record.owner && <span>{he ? 'אחראי:' : 'Owner:'} {record.owner}</span>}
      {record.dueDate && <span>{he ? 'יעד:' : 'Due:'} {record.dueDate}</span>}
      {record.sourceUrl && <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary-600 hover:underline"><ExternalLink size={13}/>
        {he ? 'מקור / אסמכתה' : 'Evidence / source'}</a>}
    </div>
  </article>;
}

/** Only rendered for agency staff; Firestore rules independently enforce access. */
export default function ProjectOperationsPanel({ project, requests, locale }: {
  project: ClientProject; requests: Request[]; locale: string;
}) {
  const he = locale === 'he';
  const cache = useQueryClient();
  const key = ['project-private-operations', project.id];
  const { data: records = [], isLoading, error } = useQuery({
    queryKey: key, queryFn: () => listProjectPrivateRecords(project.id), staleTime: 15_000,
  });
  const [kind, setKind] = useState<ProjectRecordKind>('decision');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [hours, setHours] = useState('0.5');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<'all' | ProjectRecordKind>('all');
  const refresh = () => cache.invalidateQueries({ queryKey: key });
  const recordCount = records.filter(r => r.status === 'open' || r.status === 'failed').length;
  const privateHours = records.filter(r => r.kind === 'time').reduce((n, r) => n + (r.hours || 0), 0);
  const sharedHours = project.workLogs.reduce((n, r) => n + (r.hours || 0), 0);
  const completedStages = project.stages.filter(s => s.status === 'completed').length;
  const visible = filter === 'all' ? records : records.filter(r => r.kind === filter);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const input: NewProjectPrivateRecord = {
      kind, title, details, owner, dueDate, sourceUrl,
      ...(kind === 'time' ? { hours: Number(hours) } : {}),
    };
    const issue = validateProjectPrivateRecord(input);
    if (issue) { toast.error(issue); return; }
    setBusy(true);
    try {
      await addProjectPrivateRecord(project.id, input);
      await refresh();
      setTitle(''); setDetails(''); setSourceUrl(''); setOwner(''); setDueDate('');
      toast.success(he ? 'הרשומה נשמרה במרחב הפנימי' : 'Saved privately');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to save'); }
    finally { setBusy(false); }
  };

  return <section className="space-y-4 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900"
    aria-label={he ? 'מרכז תפעול פנימי' : 'Internal operations hub'}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold"><LockKeyhole className="text-primary-600" size={19}/>
          {he ? 'מרכז ניהול פנימי' : 'Agency operations hub'}</h2>
        <p className="mt-1 text-xs text-surface-500">
          {he ? 'החלטות, QA, ספקים, פעולות המשך וזמן עבודה. הרשומות אינן חשופות ללקוח.' :
            'Decisions, QA, vendors, follow-ups and time. Hidden from client accounts.'}
        </p>
      </div>
      <span className="rounded-full bg-surface-100 px-2 py-1 text-xs text-surface-600 dark:bg-surface-800 dark:text-surface-200">
        {he ? 'פנימי בלבד' : 'Agency only'}
      </span>
    </div>
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800">
        <p className="text-xs text-surface-500">{he ? 'מה הושלם?' : 'Completed stages'}</p>
        <p className="mt-1 text-lg font-bold">{completedStages}/{project.stages.length}</p>
      </div>
      <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800">
        <p className="text-xs text-surface-500">{he ? 'מה עדיין פתוח?' : 'Open operations'}</p>
        <p className="mt-1 text-lg font-bold">{recordCount} <span className="text-xs font-normal">+ {project.blockers.filter(b => !b.resolved).length} {he ? 'חסמים' : 'blockers'}</span></p>
      </div>
      <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800">
        <p className="text-xs text-surface-500">{he ? 'זמן שתועד' : 'Recorded time'}</p>
        <p className="mt-1 text-lg font-bold">{(privateHours + sharedHours).toLocaleString(he ? 'he-IL' : 'en-US')}h</p>
        <p className="text-xs text-surface-500">{he ? 'פנימי + ביומן הפרויקט' : 'Private + project work log'}</p>
      </div>
    </div>
    <div className="border-t border-surface-100 pt-4 dark:border-surface-800">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Clock3 size={16}/>
        {he ? 'מה הובטח וכמה עוד לתשלום?' : 'Scope and commercial position'}</h3>
      <FinanceOverview project={project} requests={requests} locale={locale}/>
    </div>
    <div className="border-t border-surface-100 pt-4 dark:border-surface-800">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Plus size={16}/>
        {he ? 'הוספת תיעוד פנימי' : 'Add internal evidence'}</h3>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-semibold">{he ? 'סוג רשומה' : 'Record type'}
          <select className={inputClass} value={kind} onChange={e => setKind(e.target.value as ProjectRecordKind)}>
            {PROJECT_RECORD_KINDS.map(k => <option key={k} value={k}>{labels[k][he ? 'he' : 'en']}</option>)}
          </select></label>
        <label className="grid gap-1 text-xs font-semibold">{he ? 'כותרת' : 'Title'}
          <input required maxLength={160} className={inputClass} value={title} onChange={e => setTitle(e.target.value)}
            placeholder={he ? 'למשל: ורד אישרה 10 יחידות לכל מק״ט' : 'e.g. Client approved inventory quantities'}/></label>
        <label className="grid gap-1 text-xs font-semibold sm:col-span-2">{he ? 'פרטים ותוצאה' : 'Details / outcome'}
          <textarea maxLength={3000} rows={3} value={details} onChange={e => setDetails(e.target.value)}
            className={inputClass + ' py-2'} placeholder={he ? 'מה קרה, איך נבדק, ומה עדיין צריך לעשות?' : 'What happened and what remains?'}/></label>
        <label className="grid gap-1 text-xs font-semibold">{he ? 'אחראי / ספק' : 'Owner / vendor'}
          <input maxLength={100} className={inputClass} value={owner} onChange={e => setOwner(e.target.value)}/></label>
        {kind === 'time' ? <label className="grid gap-1 text-xs font-semibold">{he ? 'שעות' : 'Hours'}
          <input type="number" min="0.25" max="24" step="0.25" required className={inputClass}
            value={hours} onChange={e => setHours(e.target.value)}/></label> :
          <label className="grid gap-1 text-xs font-semibold">{he ? 'תאריך יעד (אופציונלי)' : 'Due date (optional)'}
            <input type="date" className={inputClass} value={dueDate} onChange={e => setDueDate(e.target.value)}/></label>}
        <label className="grid gap-1 text-xs font-semibold sm:col-span-2">{he ? 'קישור למקור / אסמכתה' : 'Source / evidence URL'}
          <input type="url" maxLength={1024} placeholder="https://" className={inputClass}
            value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}/></label>
        <button type="submit" disabled={busy || !title.trim()} className="portal-focus-ring min-h-11 rounded-xl bg-primary-600 px-5 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2">
          {busy ? (he ? 'שומר…' : 'Saving…') : (he ? 'שמור כרשומה פנימית' : 'Save internal record')}
        </button>
      </form>
    </div>
    <div className="border-t border-surface-100 pt-4 dark:border-surface-800">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><FileCheck2 size={16}/>
        {he ? 'יומן ראיות, החלטות ופעולות' : 'Operational evidence history'}</h3>
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}
          className={'rounded-lg px-3 py-1.5 text-xs ' + (filter === 'all' ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 dark:bg-surface-800')}>
          {he ? 'הכול' : 'All'}</button>
        {PROJECT_RECORD_KINDS.map(k => <button type="button" key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}
          className={'rounded-lg px-3 py-1.5 text-xs ' + (filter === k ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 dark:bg-surface-800')}>
          {labels[k][he ? 'he' : 'en']}</button>)}
      </div>
      {isLoading && <p className="text-xs text-surface-500">{he ? 'טוען רשומות…' : 'Loading…'}</p>}
      {error && <p role="alert" className="text-xs text-red-600">{he ? 'לא ניתן לטעון את הרשומות הפנימיות' : 'Could not load private records'}</p>}
      {!isLoading && !error && visible.length === 0 && <p className="text-xs text-surface-500">{he ? 'אין עדיין תיעוד בקטגוריה הזאת' : 'No records in this category yet'}</p>}
      <div className="space-y-2">
        {visible.map(r => <RecordRow key={r.id} record={r} projectId={project.id} locale={locale} onSaved={refresh}/>)}
      </div>
      {records.length >= 100 && <p className="mt-3 text-xs text-amber-700">{he ? 'מוצגות 100 הרשומות האחרונות בלבד' : 'Showing only 100 recent records'}</p>}
      <p className="mt-3 flex items-center gap-1 text-xs text-surface-500"><CheckCircle2 size={13}/>
        {he ? 'תיעוד QA אינו מאשר אוטומטית פרסום, גבייה או עלייה לאוויר.' :
          'QA evidence does not automatically approve deployment, payments or launch.'}
      </p>
    </div>
  </section>;
}
