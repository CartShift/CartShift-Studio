'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ExternalLink, Loader2, Plus, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { queryKeys } from '@/lib/utils/query-keys';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useAgencyTeam } from '@/lib/hooks/useAgencyTeam';

type Prospect = {
  id: string;
  brandName: string;
  canonicalDomain: string;
  storeUrl: string;
  stage: string;
  platform: string;
  sourceUrl: string;
  sourceType: string;
  outreachEligibility: string;
  doNotContact: boolean;
  researchNote: string;
  nextAction: string;
  nextActionAt: string;
  technicalStatus: string;
  scanStatus: string;
  lastAuditedAt: string | null;
  verifiedIssueCount: number;
  updatedAt: string | null;
};
type Finding = {
  id: string; title: string; category: string;
  observedUrl: string; evidenceExcerpt: string;
  businessRelevance: string; verificationStatus: string;
};
type ListResponse = { prospects: Prospect[]; truncated: boolean };
type ContactCandidate = {
  id: string; name: string; role: string; businessEmail: string;
  sourceUrl: string; status: string;
};
type DetailResponse = { prospect: Prospect; findings: Finding[]; contacts: ContactCandidate[] };

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } });
  if (!response.ok) throw new Error(response.status === 403 ? 'forbidden' : 'request_failed');
  return response.json() as Promise<T>;
}

export default function ProspectsClient() {
  const t = useTranslations('portal.prospects');
  const queryClient = useQueryClient();
  const stageLabels: Record<string, string> = {
    needs_review: t('stageLabels.needs_review'), qualified: t('stageLabels.qualified'),
    contact_research: t('stageLabels.contact_research'),
    contact_ready: t('stageLabels.contact_ready'),
    in_conversation: t('stageLabels.in_conversation'), proposal: t('stageLabels.proposal'),
    won: t('stageLabels.won'), lost: t('stageLabels.lost'),
    suppressed: t('stageLabels.suppressed'),
  };
  const { userData, user } = usePortalAuth();
  const agencyTeam = useAgencyTeam();
  const canReview = userData?.agencyRole === 'owner' || userData?.agencyRole === 'admin';
  const [search, setSearch] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [myOnly, setMyOnly] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [bulkUrls, setBulkUrls] = useState('');
  const [importPreview, setImportPreview] = useState<{
    requested: number; unique: number;
    prospects: Array<{ canonical_domain: string; exists: boolean }>;
  } | null>(null);
  const [salesDraft, setSalesDraft] = useState({
    stage: 'needs_review', next_action: '', due_date: '', owner_uid: '',
  });
  const [reviewNote, setReviewNote] = useState('');
  const [reviewEvidence, setReviewEvidence] = useState('');
  const [reviewDecision, setReviewDecision] = useState('review_required');
  const [findingReviewNote, setFindingReviewNote] = useState('');
  const [form, setForm] = useState({ store_url: '', brand_name: '', source_url: '', research_note: '' });

  const list = useQuery({
    queryKey: queryKeys.prospects.all,
    queryFn: () => fetchJson<ListResponse>('/api/portal/agency/prospects'),
    staleTime: 30_000,
  });
  const detail = useQuery({
    queryKey: queryKeys.prospects.detail(selected || ''),
    queryFn: () => fetchJson<DetailResponse>('/api/portal/agency/prospects/' + selected),
    enabled: Boolean(selected),
    staleTime: 30_000,
  });
  const create = useMutation({
    mutationFn: () => fetchJson<{ prospect_id: string; created: boolean }>(
      '/api/portal/agency/prospects',
      { method: 'POST', body: JSON.stringify({
        ...form, source_url: form.source_url || form.store_url,
      }) }
    ),
    onSuccess: async result => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.prospects.all });
      toast.success(result.created ? t('created') : t('duplicate'));
      setForm({ store_url: '', brand_name: '', source_url: '', research_note: '' });
      setShowCreate(false);
      setSelected(result.prospect_id);
    },
    onError: () => toast.error(t('saveFailed')),
  });
  const scan = useMutation({
    mutationFn: (id: string) => fetchJson<{
      prospect_id: string; findings_saved: number; contact_candidates_saved: number;
    }>('/api/portal/agency/prospects/' + id + '/scan', { method: 'POST' }),
    onSuccess: async result => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.prospects.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.prospects.detail(result.prospect_id) }),
      ]);
      toast.success(t('scanCompleted', { findings: result.findings_saved, contacts: result.contact_candidates_saved }));
    },
    onError: () => toast.error(t('scanFailed')),
  });
  const updateSales = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, string> }) =>
      fetchJson<{ updated: boolean }>('/api/portal/agency/prospects/' + id, {
        method: 'PATCH', body: JSON.stringify(patch),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.prospects.all });
      toast.success(t('updated'));
    },
    onError: () => toast.error(t('updateFailed')),
  });
  const bulkImport = useMutation({
    mutationFn: async (confirm: boolean) => {
      const lines = bulkUrls.split(/\r?\n/).map(v => v.trim()).filter(Boolean).slice(0, 20);
      if (!lines.length) throw new Error('No stores');
      return fetchJson<{
        requested: number; unique: number; created?: number; duplicate?: number;
        prospects?: Array<{ canonical_domain: string; exists: boolean }>;
      }>('/api/portal/agency/prospects/import', {
        method: confirm ? 'PUT' : 'POST',
        body: JSON.stringify({
          confirm,
          stores: lines.map(line => {
            const raw = line.startsWith('https://') ? line : 'https://' + line;
            return { store_url: raw, source_url: raw };
          }),
        }),
      });
    },
    onSuccess: async (result, confirm) => {
      if (confirm) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.prospects.all });
        toast.success(t('importDone', { created: result.created || 0 }));
        setBulkUrls('');
        setImportPreview(null);
        setShowImport(false);
      } else {
        setImportPreview({ requested: result.requested,
          unique: result.unique, prospects: result.prospects || [] });
      }
    },
    onError: () => toast.error(t('importFailed')),
  });
  const review = useMutation({
    mutationFn: (payload: { id: string; type: 'contact' | 'technical'; note: string;
      evidence_url?: string; outreach_eligibility?: string }) =>
      fetchJson<{ prospect_id: string }>('/api/portal/agency/prospects/' + payload.id + '/review', {
        method: 'POST', body: JSON.stringify(payload),
      }),
    onSuccess: async result => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.prospects.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.prospects.detail(result.prospect_id) }),
      ]);
      toast.success(t('reviewSaved'));
    },
    onError: () => toast.error(t('reviewFailed')),
  });
  const findingReview = useMutation({
    mutationFn: ({ id, findingId, decision, note }: {
      id: string; findingId: string; decision: 'verified' | 'rejected'; note: string;
    }) => fetchJson<{ prospect_id: string }>(
      '/api/portal/agency/prospects/' + id + '/findings/' + findingId + '/review', {
        method: 'POST', body: JSON.stringify({ decision, note }),
      }),
    onSuccess: async result => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.prospects.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.prospects.detail(result.prospect_id) }),
      ]);
      toast.success(t('findingReviewed'));
      setFindingReviewNote('');
    },
    onError: () => toast.error(t('reviewFailed')),
  });
  const removeContact = useMutation({
    mutationFn: ({ id, contactId }: { id: string; contactId: string }) =>
      fetchJson<{ removed: boolean }>('/api/portal/agency/prospects/' + id + '/contacts/' +
        contactId, { method: 'DELETE' }),
    onSuccess: async (_result, input) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.prospects.detail(input.id) });
      toast.success(t('contactRemoved'));
    },
    onError: () => toast.error(t('removeContactFailed')),
  });
  const rows = (list.data?.prospects || []).filter(row =>
    (!verifiedOnly || row.verifiedIssueCount > 0) &&
    (!myOnly || row.ownerUid === user?.uid) &&
    [row.brandName, row.canonicalDomain, row.stage].some(value =>
      value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
    )
  ).sort((a, b) => b.verifiedIssueCount - a.verifiedIssueCount ||
    (a.nextActionAt || '9999').localeCompare(b.nextActionAt || '9999'));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t('title')}</h1>
          <p className="max-w-2xl text-sm text-surface-500">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => list.refetch()} disabled={list.isFetching}>
            <RefreshCw size={16} className={list.isFetching ? 'animate-spin' : ''} />
            {t('refresh')}
          </Button>
          <Button variant="outline" onClick={() => { setShowImport(x => !x); setImportPreview(null); }}>
            <Plus size={16}/>{t('import')}
          </Button>
          <Button onClick={() => setShowCreate(x => !x)}>
            <Plus size={16} />{t('add')}
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-surface-600 dark:text-surface-300">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <span>{t('privacyNotice')}</span>
      </div>

      {showImport && (
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold">{t('importTitle')}</h2>
          <p className="text-sm text-surface-500">{t('importHint')}</p>
          <textarea value={bulkUrls} rows={5} onChange={e => {
            setBulkUrls(e.target.value); setImportPreview(null);
          }} placeholder={'https://store-one.co.il\nhttps://store-two.co.il'}
            className="w-full rounded-lg border border-surface-200 bg-white p-3 font-mono text-sm text-surface-900 dark:border-surface-700 dark:bg-surface-900 dark:text-white"/>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={bulkImport.isPending} onClick={() => bulkImport.mutate(false)}>
              {t('previewImport')}
            </Button>
            {importPreview && <Button disabled={bulkImport.isPending} onClick={() => bulkImport.mutate(true)}>
              {t('confirmImport')}
            </Button>}
          </div>
          {importPreview && (
            <div className="space-y-1 text-sm text-surface-500">
              <p>{t('importPreview', { requested: importPreview.requested, unique: importPreview.unique })}</p>
              {importPreview.prospects.map(row =>
                <p key={row.canonical_domain} dir="ltr">{row.canonical_domain} — {row.exists ? t('duplicate') : t('newProspect')}</p>)}
            </div>
          )}
        </Card>
      )}
      {showCreate && (
        <Card className="p-5">
          <form className="space-y-3" onSubmit={e => { e.preventDefault(); create.mutate(); }}>
            <h2 className="font-semibold text-surface-900 dark:text-white">{t('newTitle')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ['store_url', t('storeUrl'), 'https://example.co.il'],
                ['brand_name', t('brandName'), t('optional')],
                ['source_url', t('sourceUrl'), 'https://example.co.il/about'],
              ] as const).map(([field, label, placeholder]) => (
                <label key={field} className="space-y-1 text-sm text-surface-600 dark:text-surface-300">
                  <span>{label}</span>
                  <input
                    className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-surface-900 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-surface-700 dark:bg-surface-900 dark:text-white"
                    type={field === 'brand_name' ? 'text' : 'url'}
                    placeholder={placeholder}
                    required={field === 'store_url'}
                    value={form[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            <label className="block space-y-1 text-sm text-surface-600 dark:text-surface-300">
              <span>{t('researchNote')}</span>
              <textarea className="w-full rounded-lg border border-surface-200 bg-white p-3 text-surface-900 dark:border-surface-700 dark:bg-surface-900 dark:text-white"
                maxLength={1000} rows={2} value={form.research_note}
                onChange={e => setForm(p => ({ ...p, research_note: e.target.value }))} />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 size={16} className="animate-spin" />}
                {t('save')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>{t('cancel')}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="relative">
        <Search size={17} className="pointer-events-none absolute start-3 top-3 text-surface-400" />
        <input aria-label={t('search')} placeholder={t('search')} value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-surface-200 bg-white py-2.5 ps-10 pe-3 text-sm text-surface-900 dark:border-surface-700 dark:bg-surface-900 dark:text-white" />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="inline-flex items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 dark:border-surface-700">
          <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)}/>
          {t('onlyVerified')}
        </label>
        <label className="inline-flex items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 dark:border-surface-700">
          <input type="checkbox" checked={myOnly} onChange={e => setMyOnly(e.target.checked)}/>
          {t('myProspects')}
        </label>
        <span className="text-surface-500">{t('showing', { shown: rows.length, total: list.data?.prospects.length || 0 })}</span>
      </div>
      {list.isLoading && <p role="status" className="text-sm text-surface-500">{t('loading')}</p>}
      {list.isError && <p role="alert" className="text-sm text-red-600">{t('loadFailed')}</p>}
      {list.data && rows.length === 0 && <p className="py-10 text-center text-surface-500">{t('empty')}</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {rows.map(prospect => (
          <Card key={prospect.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold text-surface-900 dark:text-white">{prospect.brandName}</h2>
                <a href={prospect.storeUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline dark:text-primary-300">
                  <span dir="ltr">{prospect.canonicalDomain}</span><ExternalLink size={13}/>
                </a>
              </div>
              <span className="shrink-0 rounded-full bg-surface-100 px-2 py-1 text-xs text-surface-600 dark:bg-surface-800 dark:text-surface-300">
                {stageLabels[prospect.stage] || prospect.stage}
              </span>
            </div>
            {prospect.researchNote && <p className="line-clamp-2 text-sm text-surface-500">{prospect.researchNote}</p>}
            <p className="text-xs text-surface-500">{t('source')}: {prospect.sourceType}</p>
            <p className="text-xs text-surface-500">{t('scanState')}: {prospect.scanStatus}</p>
            {prospect.nextAction && <p className="text-sm text-surface-600 dark:text-surface-300">{t('nextAction')}: {prospect.nextAction}</p>}
            {prospect.nextActionAt && <p className="text-xs text-surface-500">{t('dueDate')}: <span dir="ltr">{prospect.nextActionAt}</span></p>}
            {prospect.verifiedIssueCount > 0 && <p className="text-xs text-surface-500">{t('verifiedCount', { count: prospect.verifiedIssueCount })}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-surface-500">{t('noPermission')}</span>
              <Button variant="outline" disabled={scan.isPending} onClick={() => scan.mutate(prospect.id)}>
                {scan.isPending && scan.variables === prospect.id && <Loader2 size={14} className="animate-spin" />}
                {t('scanStore')}
              </Button>
              <Button variant="outline" onClick={() => {
                setSelected(p => p === prospect.id ? null : prospect.id);
                setSalesDraft({ stage: prospect.stage, next_action: prospect.nextAction || '',
                  due_date: prospect.nextActionAt || '', owner_uid: prospect.ownerUid || '' });
              }}>
                {selected === prospect.id ? t('close') : t('evidence')}
              </Button>
            </div>
            {selected === prospect.id && (
              <div className="space-y-3 border-t border-surface-200 pt-3 dark:border-surface-700">
                <form className="space-y-2 rounded-lg bg-surface-50 p-3 dark:bg-surface-900"
                  onSubmit={e => {
                    e.preventDefault();
                    updateSales.mutate({ id: prospect.id, patch: {
                      stage: salesDraft.stage,
                      next_action: salesDraft.next_action,
                      ...(salesDraft.due_date ? { due_date: salesDraft.due_date } : {}),
                      ...(salesDraft.owner_uid ? { owner_uid: salesDraft.owner_uid } : {}),
                    } });
                  }}>
                  <label className="block text-sm text-surface-600 dark:text-surface-300">
                    {t('stage')}
                    <select value={salesDraft.stage}
                      onChange={e => setSalesDraft(p => ({ ...p, stage: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-surface-200 bg-white p-2 text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-white">
                      {['needs_review', 'qualified', 'contact_research', 'contact_ready',
                        'in_conversation', 'proposal', 'won', 'lost'].map(stage => (
                        <option key={stage} value={stage}>{stageLabels[stage] || stage}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-surface-600 dark:text-surface-300">
                    {t('assignedTo')}
                    <select value={salesDraft.owner_uid}
                      onChange={e => setSalesDraft(p => ({ ...p, owner_uid: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-surface-200 bg-white p-2 text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-white">
                      <option value="">{t('unassigned')}</option>
                      {(agencyTeam.data || []).filter(member =>
                        ['owner', 'admin', 'sales_manager'].includes(member.agencyRole || '') &&
                        member.status !== 'inactive' && member.status !== 'suspended'
                      ).map(member => (
                        <option key={member.id} value={member.id}>{member.name || member.email}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-surface-600 dark:text-surface-300">
                    {t('nextAction')}
                    <input value={salesDraft.next_action} maxLength={500}
                      onChange={e => setSalesDraft(p => ({ ...p, next_action: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-surface-200 bg-white p-2 text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-white"/>
                  </label>
                  <label className="block text-sm text-surface-600 dark:text-surface-300">
                    {t('dueDate')}
                    <input type="date" value={salesDraft.due_date}
                      onChange={e => setSalesDraft(p => ({ ...p, due_date: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-surface-200 bg-white p-2 text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-white"/>
                  </label>
                  <Button type="submit" disabled={updateSales.isPending}>{t('saveSales')}</Button>
                  <p className="text-xs text-surface-500">{t('approvalReminder')}</p>
                </form>
                {canReview && (
                  <section className="space-y-2 rounded-lg border border-surface-200 p-3 dark:border-surface-700">
                    <h3 className="text-sm font-semibold">{t('founderReview')}</h3>
                    <label className="block text-sm text-surface-600 dark:text-surface-300">
                      {t('contactEligibility')}
                      <select value={reviewDecision} onChange={e => setReviewDecision(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-surface-200 bg-white p-2 text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-white">
                        {['review_required', 'consent_recorded', 'existing_relationship',
                          'approved_partner_channel', 'blocked'].map(value =>
                          <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                    <input type="url" value={reviewEvidence}
                      onChange={e => setReviewEvidence(e.target.value)}
                      placeholder={t('eligibilityEvidence')}
                      className="w-full rounded-lg border border-surface-200 bg-white p-2 text-sm text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-white"/>
                    <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)}
                      rows={2} maxLength={1000} placeholder={t('reviewNote')}
                      className="w-full rounded-lg border border-surface-200 bg-white p-2 text-sm text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-white"/>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" disabled={review.isPending || reviewNote.trim().length < 15}
                        onClick={() => review.mutate({ id: prospect.id, type: 'contact',
                          outreach_eligibility: reviewDecision,
                          evidence_url: reviewEvidence || undefined, note: reviewNote })}>
                        {t('saveEligibility')}
                      </Button>
                      <Button variant="outline" disabled={review.isPending || reviewNote.trim().length < 15}
                        onClick={() => review.mutate({ id: prospect.id, type: 'technical',
                          note: reviewNote })}>
                        {t('approveTechnical')}
                      </Button>
                    </div>
                    <p className="text-xs text-surface-500">{t('founderOnly')}</p>
                  </section>
                )}
                {detail.isLoading && <p className="text-sm text-surface-500">{t('loading')}</p>}
                {detail.isError && <p role="alert" className="text-sm text-red-600">{t('loadFailed')}</p>}
                {detail.data && detail.data.findings.length === 0 && <p className="text-sm text-surface-500">{t('noFindings')}</p>}
                {detail.data?.findings.map(finding => (
                  <div key={finding.id} className="space-y-1 rounded-lg bg-surface-50 p-3 dark:bg-surface-900">
                    <p className="font-medium text-surface-900 dark:text-white">{finding.title}</p>
                    <p className="text-sm text-surface-500">{finding.evidenceExcerpt}</p>
                    <a href={finding.observedUrl} target="_blank" rel="noopener noreferrer"
                      className="block truncate text-xs text-primary-600 hover:underline dark:text-primary-300">
                      {t('viewEvidence')}
                    </a>
                    <p className="text-xs text-surface-500">
                      {finding.verificationStatus === 'unverified' ? t('unverified') :
                        finding.verificationStatus === 'verified' ? t('verified') : t('rejected')}
                    </p>
                    {canReview && (
                      <div className="space-y-2">
                        <input value={findingReviewNote} maxLength={1000}
                          onChange={e => setFindingReviewNote(e.target.value)}
                          placeholder={t('findingReviewNote')}
                          className="w-full rounded-lg border border-surface-200 bg-white p-2 text-xs text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-white"/>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" disabled={findingReview.isPending || findingReviewNote.trim().length < 15}
                            onClick={() => findingReview.mutate({
                              id: prospect.id, findingId: finding.id, decision: 'verified', note: findingReviewNote,
                            })}>{t('verifyFinding')}</Button>
                          <Button variant="outline" disabled={findingReview.isPending || findingReviewNote.trim().length < 15}
                            onClick={() => findingReview.mutate({
                              id: prospect.id, findingId: finding.id, decision: 'rejected', note: findingReviewNote,
                            })}>{t('rejectFinding')}</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {detail.data && <h3 className="text-sm font-semibold text-surface-900 dark:text-white">{t('contacts')}</h3>}
                {detail.data?.contacts.length === 0 && <p className="text-sm text-surface-500">{t('noContacts')}</p>}
                {detail.data?.contacts.map(contact => (
                  <div key={contact.id} className="rounded-lg border border-surface-200 p-3 text-sm dark:border-surface-700">
                    <p className="font-medium text-surface-900 dark:text-white">{contact.name || contact.role}</p>
                    {contact.name && <p className="text-surface-500">{contact.role}</p>}
                    {contact.businessEmail && <p className="text-surface-500" dir="ltr">{contact.businessEmail}</p>}
                    <a href={contact.sourceUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline dark:text-primary-300">{t('viewEvidence')}</a>
                    <p className="text-xs text-amber-600">{t('candidateContact')}</p>
                    <p className="text-xs text-surface-500">{contact.sourceUrl}</p>
                    {canReview && <Button variant="outline" disabled={removeContact.isPending}
                      onClick={() => removeContact.mutate({ id: prospect.id, contactId: contact.id })}>
                      {t('removeContact')}
                    </Button>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
      {list.data?.truncated && <p className="text-sm text-surface-500">{t('truncated')}</p>}
    </div>
  );
}
