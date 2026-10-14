import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { assertReviewEditor, reviewRef, reviewDb } from '@/lib/services/store-review-admin-server';

const headers = { 'Cache-Control': 'no-store' };
const escapeHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
type Finding = {
  title: string; observedUrl: string; observation: string;
  whyItMatters: string; recommendedAction: string; priority: string;
};
function renderReport(data: { name: string; storeUrl: string; reviewReport: {summary: string; findings: Finding[]}; locale: string }) {
  const he = data.locale === 'he';
  const intro = he ? 'היי' : 'Hi';
  const title = he ? 'סקירת החנות שלכם — CartShift Studio' : 'Your store review — CartShift Studio';
  const text = [
    intro + ' ' + data.name + ',', '', data.reviewReport.summary, '',
    ...data.reviewReport.findings.flatMap((f,i) => [
      (i+1) + '. ' + f.title + ' (' + f.priority + ')',
      f.observation, f.whyItMatters, f.recommendedAction, f.observedUrl, ''
    ]),
    he ? 'נשמח לדבר על אפשרויות היישום אם זה רלוונטי.' : 'Happy to discuss implementation if useful.',
    'CartShift Studio',
  ].join('\n');
  const html = `<div dir="${he ? 'rtl':'ltr'}" style="font:16px/1.7 Arial,sans-serif;max-width:680px;margin:auto;color:#172032">
    <h1>${escapeHtml(title)}</h1><p>${escapeHtml(intro + ' ' + data.name)},</p>
    <p>${escapeHtml(data.reviewReport.summary).replace(/\n/g,'<br>')}</p>
    <h2>${he ? 'ממצאים והמלצות' : 'Findings & next steps'}</h2>
    ${data.reviewReport.findings.map((f,i)=> `<div style="padding:16px 0;border-top:1px solid #ddd">
      <h3>${i+1}. ${escapeHtml(f.title)}</h3><p>${escapeHtml(f.observation)}</p>
      <p><strong>${he ? 'למה זה חשוב:' : 'Why it matters:'}</strong> ${escapeHtml(f.whyItMatters)}</p>
      <p><strong>${he ? 'מה כדאי לעשות:' : 'Recommended action:'}</strong> ${escapeHtml(f.recommendedAction)}</p>
      <p><a href="${escapeHtml(f.observedUrl)}">${escapeHtml(f.observedUrl)}</a></p></div>`).join('')}
    <p>${he ? 'אם תרצו, נשמח לדבר על האפשרות לבצע את השיפורים.' : 'If helpful, we can discuss implementing the improvements.'}</p>
    <p>CartShift Studio</p>
    <p style="font-size:12px;color:#777">${he ? 'סקירה מקצועית ראשונית של העמודים הציבוריים בחנות. לא בדיקת תאימות או אבטחה.' : 'An initial professional review of public pages, not a compliance or security audit.'}</p></div>`;
  return { subject: title, html, text };
}

export async function POST(request: NextRequest, { params }: {params: Promise<{requestId: string}>}) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401, headers });
  if (request.headers.get('origin') && request.headers.get('origin') !== request.nextUrl.origin)
    return NextResponse.json({ error: 'ORIGIN_NOT_ALLOWED' }, { status: 403, headers });
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'EMAIL_UNCONFIGURED' }, { status: 503, headers });
  try {
    await assertReviewEditor(session.uid);
    const { requestId } = await params;
    const ref = reviewRef(requestId);
    const db = reviewDb();
    const now = new Date();
    const send = await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('NOT_FOUND');
      const data = snap.data()!;
      if (data.schemaVersion !== 2 || data.reviewStatus !== 'in_review') throw new Error('NOT_READY');
      const report = data.reviewReport;
      if (!report || report.summary?.length < 30 || report.findings?.length < 3 ||
        report.findings?.length > 5) throw new Error('REPORT_INCOMPLETE');
      if (data.delivery?.status === 'sending' &&
          now.getTime() - (data.delivery.startedAt?.toDate?.()?.getTime() || 0) < 10 * 60_000) {
        throw new Error('DELIVERY_IN_PROGRESS');
      }
      const deliveryKey = createHash('sha256').update(requestId + ':' + report.version).digest('hex');
      tx.update(ref, { delivery: { status: 'sending', startedAt: now, idempotencyKey: deliveryKey } });
      return { data: {
        name: String(data.name || ''), email: String(data.email),
        storeUrl: String(data.storeUrl), locale: String(data.locale),
        reviewReport: report as {summary:string;findings: Finding[]},
      }, deliveryKey };
    });
    const mail = renderReport(send.data);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Idempotency-Key': send.deliveryKey,
      },
      body: JSON.stringify({ from: 'CartShift Studio <noreply@cart-shift.com>', to: [send.data.email],
        subject: mail.subject, html: mail.html, text: mail.text, reply_to: 'hello@cart-shift.com' }),
      signal: AbortSignal.timeout(15000),
    });
    const result = (await response.json().catch(()=>({}))) as { id?: string };
    if (!response.ok || !result.id) throw new Error('DELIVERY_FAILED');
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.delivery?.idempotencyKey !== send.deliveryKey) throw new Error('DELIVERY_STATE_CHANGED');
      const previous = snap.data()!;
      tx.update(ref, {
        reviewStatus: 'delivered', status: 'delivered', updatedAt: new Date(),
        statusHistory: [...(previous.statusHistory || []), { status: 'delivered', at: new Date(), actor: session.uid }],
        delivery: { status: 'sent', emailId: result.id, sentAt: new Date(), idempotencyKey: send.deliveryKey },
      });
    });
    return NextResponse.json({ delivered: true }, { headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'UNKNOWN';
    if (msg === 'DELIVERY_FAILED' || msg === 'UNKNOWN') {
      // Intentionally preserve the sending marker for explicit retry after timeout.
      console.warn('[store-review] Review email delivery unconfirmed');
    }
    const status = msg === 'FORBIDDEN' ? 403 : msg === 'NOT_FOUND' ? 404 :
      ['NOT_READY','REPORT_INCOMPLETE','DELIVERY_IN_PROGRESS','DELIVERY_STATE_CHANGED'].includes(msg) ? 409 : 503;
    return NextResponse.json({ error: status === 503 ? 'EMAIL_DELIVERY_UNCONFIRMED' : msg }, { status, headers });
  }
}
