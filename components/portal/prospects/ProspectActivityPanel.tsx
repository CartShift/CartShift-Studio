'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClipboardCheck, History, MessageCircle, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { queryKeys } from '@/lib/utils/query-keys';

export type ProspectActivity = {
  id: string; kind: string; direction: string; outcome: string;
  note: string; actorUid: string; occurredAt: string | null; recordedAt: string | null;
};
type ActivityKind = 'note' | 'call' | 'email' | 'meeting' | 'social' | 'follow_up' | 'review_request' | 'review_completed';
type Direction = 'internal' | 'inbound' | 'outbound';
type Outcome = 'none' | 'attempted' | 'responded' | 'positive' | 'negative' | 'booked';
const communicationKinds: ActivityKind[] = ['call', 'email', 'meeting', 'social'];
const names: Record<ActivityKind, [string, string]> = {
  note: ['הערה', 'Note'], call: ['שיחה', 'Call'], email: ['דוא״ל', 'Email'],
  meeting: ['פגישה', 'Meeting'], social: ['רשת חברתית', 'Social'],
  follow_up: ['מעקב', 'Follow-up'], review_request: ['בקשת סקירה מעמיקה', 'Request deep review'],
  review_completed: ['סקירה הושלמה', 'Review completed'],
};
const outcomes: Record<Outcome, [string, string]> = {
  none: ['ללא תוצאה', 'None'], attempted: ['ניסיון פנייה', 'Attempted'],
  responded: ['התקבלה תשובה', 'Responded'], positive: ['התעניינות', 'Interested'],
  negative: ['לא מעוניינים', 'Not interested'], booked: ['נקבעה פגישה', 'Meeting booked'],
};
const directions: Record<Direction, [string, string]> = {
  internal: ['פנימי', 'Internal'], inbound: ['נכנס', 'Inbound'], outbound: ['יוצא', 'Outbound'],
};

export function ProspectActivityPanel({ prospectId, activities, canContact, canApprove, reviewStatus }: {
  prospectId: string;
  activities: ProspectActivity[];
  canContact: boolean;
  canApprove: boolean;
  reviewStatus: string;
}) {
  const he = useLocale() === 'he';
  const index = he ? 0 : 1;
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [kind, setKind] = useState<ActivityKind>('note');
  const [direction, setDirection] = useState<Direction>('internal');
  const [outcome, setOutcome] = useState<Outcome>('none');
  const [note, setNote] = useState('');
  const isCommunication = communicationKinds.includes(kind);

  const save = useMutation({
    mutationFn: async (entry: { kind: ActivityKind; direction: Direction; outcome: Outcome; note: string }) => {
      const response = await fetch('/api/portal/agency/prospects/' + encodeURIComponent(prospectId) + '/activities', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'FAILED');
      return response.json();
    },
    onSuccess: async () => {
      setExpanded(false); setNote(''); setKind('note'); setOutcome('none'); setDirection('internal');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.prospects.detail(prospectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.prospects.all }),
      ]);
      toast.success(he ? 'הפעילות נשמרה' : 'Activity saved');
    },
    onError: (error) => {
      const blocked = error instanceof Error && error.message === 'OUTREACH_REVIEW_REQUIRED';
      toast.error(blocked
        ? (he ? 'אין אישור לערוץ פנייה יוצאת' : 'Outbound channel not approved')
        : (he ? 'שמירת הפעילות נכשלה' : 'Could not save activity'));
    },
  });

  const requestReview = () => save.mutate({
    kind: 'review_request', direction: 'internal', outcome: 'none',
    note: he
      ? 'מבוקשת סקירה מקצועית להזדמנות: בדיקת UX, מובייל, דפי מוצר, ביצועים, SEO ופתרונות Shopify, עם ראיות, רמת ביטחון והמלצות מעשיות.'
      : 'Founder review requested: assess UX, mobile, product pages, performance, SEO, and Shopify opportunities with evidence, confidence and actionable recommendations.',
  });

  return (
    <section className="space-y-4 rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-surface-900 dark:text-white">
            <History className="h-4 w-4" />{he ? 'היסטוריית קשר ופעילות' : 'Relationship & activity'}
          </h3>
          <p className="mt-1 text-xs text-surface-500">{he ? 'שיחות, פגישות, הערות והמשך טיפול — הכול במקום אחד' : 'Every call, note and next step in one place'}</p>
        </div>
        <Button variant="outline" onClick={() => setExpanded(value => !value)}>
          <Plus size={15}/>{he ? 'תיעוד פעילות' : 'Log activity'}
        </Button>
      </div>
      {expanded && (
        <form className="space-y-3 rounded-xl bg-surface-50 p-3 dark:bg-surface-800"
          onSubmit={event => {
            event.preventDefault();
            save.mutate({ kind, direction: isCommunication ? direction : 'internal', outcome: isCommunication ? outcome : 'none', note });
          }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-surface-600 dark:text-surface-300">
              {he ? 'סוג פעולה' : 'Activity type'}
              <select value={kind} onChange={event => {
                const next = event.target.value as ActivityKind;
                setKind(next); if (!communicationKinds.includes(next)) setDirection('internal');
              }} className="mt-1 block w-full rounded-lg border border-surface-200 bg-white p-2 text-sm dark:border-surface-700 dark:bg-surface-900">
                {(Object.keys(names) as ActivityKind[]).filter(item => canApprove || item !== 'review_completed').map(item =>
                  <option key={item} value={item}>{names[item][index]}</option>)}
              </select>
            </label>
            {isCommunication && <label className="space-y-1 text-xs text-surface-600 dark:text-surface-300">
              {he ? 'כיוון' : 'Direction'}
              <select value={direction} onChange={event => setDirection(event.target.value as Direction)}
                className="mt-1 block w-full rounded-lg border border-surface-200 bg-white p-2 text-sm dark:border-surface-700 dark:bg-surface-900">
                {(['internal','inbound',...(canContact ? ['outbound'] : [])] as Direction[]).map(value =>
                  <option key={value} value={value}>{directions[value][index]}</option>)}
              </select>
            </label>}
            {isCommunication && <label className="space-y-1 text-xs text-surface-600 dark:text-surface-300">
              {he ? 'תוצאה' : 'Outcome'}
              <select value={outcome} onChange={event => setOutcome(event.target.value as Outcome)}
                className="mt-1 block w-full rounded-lg border border-surface-200 bg-white p-2 text-sm dark:border-surface-700 dark:bg-surface-900">
                {(Object.keys(outcomes) as Outcome[]).map(value =>
                  <option key={value} value={value}>{outcomes[value][index]}</option>)}
              </select>
            </label>}
          </div>
          <label className="block space-y-1 text-xs text-surface-600 dark:text-surface-300">
            {he ? 'סיכום הפעילות' : 'Activity notes'}
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              required minLength={3} maxLength={1500}
              placeholder={he ? 'מה קרה ומה השלב הבא?' : 'What happened and what should happen next?'}
              className="mt-1 block w-full rounded-lg border border-surface-200 bg-white p-2 text-sm dark:border-surface-700 dark:bg-surface-900"/>
          </label>
          {!canContact && isCommunication && <p className="text-xs text-amber-700 dark:text-amber-300">
            {he ? 'לתיעוד פנייה יוצאת נדרש קודם אישור לערוץ המתאים.' : 'Outbound communication requires approved channel eligibility.'}
          </p>}
          <Button type="submit" disabled={save.isPending || note.trim().length < 3}>
            <Send size={14}/>{he ? 'שמירה' : 'Save'}
          </Button>
        </form>
      )}
      {reviewStatus === 'not_requested' && <button type="button" onClick={requestReview} disabled={save.isPending}
        className="flex w-full items-center gap-3 rounded-lg border border-dashed border-primary-300 bg-primary-50/40 p-3 text-start text-sm text-primary-800 transition-colors hover:bg-primary-50 disabled:opacity-50 dark:border-primary-800 dark:bg-primary-950/20 dark:text-primary-200">
        <ClipboardCheck className="h-5 w-5 shrink-0"/>
        <span><strong className="block">{he ? 'בקשה לסקירה מעמיקה' : 'Request a deep review'}</strong>
          <span className="text-xs opacity-80">{he ? 'סמני לי את הליד לבדיקה מקצועית והצעת ערך מותאמת' : 'Put this opportunity in the founder technical-review queue'}</span>
        </span>
      </button>}
      {reviewStatus === 'requested' && <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
        {he ? 'הבקשה לסקירה נשמרה וממתינה לבדיקה מקצועית.' : 'Deep review requested; awaiting founder verification.'}
      </p>}
      <div className="space-y-3">
        {activities.length === 0 && <p className="rounded-lg bg-surface-50 p-4 text-center text-sm text-surface-500 dark:bg-surface-800">
          {he ? 'עדיין אין פעילות. אפשר להתחיל מהערת מחקר קצרה.' : 'No activity yet. Start with a research note.'}
        </p>}
        {activities.map(event => (
          <div key={event.id} className="flex gap-3 border-b border-surface-100 pb-3 last:border-0 dark:border-surface-800">
            <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-500 dark:bg-surface-800"><MessageCircle size={15}/></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="text-sm font-semibold text-surface-900 dark:text-white">{names[event.kind as ActivityKind]?.[index] || event.kind}</span>
                <time dateTime={event.occurredAt || undefined} className="text-xs text-surface-400">
                  {event.occurredAt ? new Intl.DateTimeFormat(he ? 'he-IL' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.occurredAt)) : ''}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-surface-600 dark:text-surface-300">{event.note}</p>
              <p className="mt-1 text-xs text-surface-400">
                {directions[event.direction as Direction]?.[index] || event.direction} · {outcomes[event.outcome as Outcome]?.[index] || event.outcome}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
