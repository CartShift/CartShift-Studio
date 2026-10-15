'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Link2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAgencyClients } from '@/lib/hooks/useAgencyClients';
import { useAllPricingRequests } from '@/lib/hooks/usePricingRequests';
import { queryKeys } from '@/lib/utils/query-keys';
import { Button } from '@/components/ui/Button';
import { getPortalPath } from '@/lib/utils/portal-paths';

const READY = new Set(['QUOTED', 'ACCEPTED', 'PAID']);

/**
 * Founder-only UI: links real, already approved client commercial documents.
 * Never creates offers, sends messages or changes payment state.
 */
export function ProspectProposalLinkPanel({ prospectId, canonicalDomain }: {
  prospectId: string; canonicalDomain: string;
}) {
  const he = useLocale() === 'he';
  const client = useQueryClient();
  const { organizations, loading: clientsLoading } = useAgencyClients();
  const { requests, loading: quotesLoading } = useAllPricingRequests();
  const [orgId, setOrgId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [note, setNote] = useState('');

  const validOrganizations = useMemo(() => organizations.filter(organization => {
    if (!organization.website) return true; // Owner can confirm a legacy account without a published URL.
    try {
      const host = new URL(/^https?:\/\//.test(organization.website) ? organization.website : 'https://' + organization.website)
        .hostname.toLowerCase().replace(/^www\./, '');
      return host === canonicalDomain;
    } catch { return false; }
  }), [organizations, canonicalDomain]);

  const availableRequests = useMemo(() => requests.filter(request =>
    request.orgId === orgId && request.isBillable === true && READY.has(request.status)
  ), [requests, orgId]);

  const link = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/portal/agency/prospects/' + encodeURIComponent(prospectId) + '/link-proposal', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, request_id: requestId, note: note.trim() }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'REQUEST_FAILED');
      return response.json();
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.prospects.all }),
        client.invalidateQueries({ queryKey: queryKeys.prospects.detail(prospectId) }),
      ]);
      toast.success(he ? 'ההצעה קושרה לליד' : 'Commercial proposal linked');
    },
    onError: (error) => {
      const code = error instanceof Error ? error.message : '';
      toast.error(code === 'ORG_DOMAIN_MISMATCH'
        ? (he ? 'כתובת הלקוח אינה תואמת לחנות' : 'Client website does not match this prospect')
        : (he ? 'הקישור נכשל. בדקי שההצעה נשלחה ושהלקוח נכון.' : 'Could not link. Verify the quote and client.'));
    },
  });

  return (
    <section className="space-y-3 rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-surface-900 dark:text-white">
          <Link2 size={16}/>{he ? 'חיבור להצעת מחיר' : 'Connect a proposal'}
        </h3>
        <p className="mt-1 text-xs text-surface-500">
          {he ? 'לאחר אישור טכני, קשרי הצעה קיימת שכבר הוצגה ללקוח. לא נשלחות הודעות ולא נרשמים תשלומים.'
            : 'Associate an existing quoted commercial document after technical approval. No message is sent or payment marked.'}
        </p>
      </div>
      <form onSubmit={event => { event.preventDefault(); link.mutate(); }} className="space-y-3">
        <label className="block space-y-1 text-xs text-surface-600 dark:text-surface-300">
          {he ? 'לקוח קיים' : 'Existing client'}
          <select value={orgId} required disabled={clientsLoading} onChange={event => { setOrgId(event.target.value); setRequestId(''); }}
            className="mt-1 block w-full rounded-lg border border-surface-200 bg-white p-2 text-sm dark:border-surface-700 dark:bg-surface-900">
            <option value="">{he ? 'בחירת לקוח' : 'Select client'}</option>
            {validOrganizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>
        </label>
        <label className="block space-y-1 text-xs text-surface-600 dark:text-surface-300">
          {he ? 'הצעת מחיר' : 'Quoted proposal'}
          <select value={requestId} required disabled={!orgId || quotesLoading} onChange={event => setRequestId(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-surface-200 bg-white p-2 text-sm dark:border-surface-700 dark:bg-surface-900">
            <option value="">{he ? 'בחירת הצעה' : 'Select quote'}</option>
            {availableRequests.map(request => <option key={request.id} value={request.id}>{request.title} — {request.status}</option>)}
          </select>
        </label>
        <label className="block space-y-1 text-xs text-surface-600 dark:text-surface-300">
          {he ? 'הסבר לקישור' : 'Relationship note'}
          <textarea value={note} onChange={event => setNote(event.target.value)} minLength={15} maxLength={1000}
            required rows={2} placeholder={he ? 'איך וידאת שזו אותה חנות ומה אושר?' : 'What confirms this is the same customer and scope?'}
            className="mt-1 block w-full rounded-lg border border-surface-200 bg-white p-2 text-sm dark:border-surface-700 dark:bg-surface-900"/>
        </label>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={link.isPending || !orgId || !requestId || note.trim().length < 15}>
            <FileText size={15}/>{he ? 'קישור ההצעה' : 'Link proposal'}
          </Button>
          <a href={getPortalPath('/requests/')} className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-300">
            {he ? 'פתיחת אזור ההצעות' : 'Open quotes'} <ExternalLink size={13}/>
          </a>
        </div>
        {orgId && !quotesLoading && availableRequests.length === 0 && <p className="text-xs text-surface-500">
          {he ? 'אין הצעה מאושרת לקישור עבור הלקוח הזה.' : 'No quoted proposal for this client is ready to link.'}
        </p>}
      </form>
    </section>
  );
}
