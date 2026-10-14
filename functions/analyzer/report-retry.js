'use strict';

// Firebase Function business logic: dependency injection keeps the scheduled
// entrypoint thin and lets security/retry behavior be tested without Firebase.
const MAX_RETRIES = 5;
const MAX_PER_RUN = 9;
const MAX_CONCURRENT = 3;
const SCAN_LIMIT = 60;
const STALE_MS = 30 * 60 * 1000;
const ELIGIBLE = ['pending', 'failed', 'retrying'];

function millis(timestamp) {
  if (typeof timestamp?.toMillis === 'function') return timestamp.toMillis();
  if (typeof timestamp?.toDate === 'function') return timestamp.toDate().getTime();
  if (timestamp instanceof Date) return timestamp.getTime();
  return typeof timestamp === 'number' ? timestamp : 0;
}

function buildPayload(id, record) {
  const job = record.delivery;
  const locale = record.locale === 'he' ? 'he' : 'en';
  return {
    email: job.email,
    storeUrl: job.storeUrl,
    locale,
    results: record.result,
    subscribeNewsletter: job.subscribeNewsletter === true,
    skipLeadCapture: job.skipLeadCapture === true,
    intent: job.intent,
    attribution: job.attribution,
    primaryIssue: job.primaryIssue,
    reportUrl: 'https://cart-shift.com/' + locale + '/tools/store-analyzer/report/' + id,
    deliveryId: id,
  };
}

/**
 * Recover delivery after an interrupted serverless after() callback.
 * Every claim is transactional; a stable deliveryId is passed to the
 * idempotent email endpoint. Terminal items stop filling the work queue.
 */
async function retryAnalysisReports({
  db, FieldValue, deliveryKey, deliveryUrl, fetchImpl = fetch,
  now = Date.now(), logger = console,
}) {
  if (!deliveryKey || !deliveryUrl) {
    logger.warn('[Analyzer retry] Delivery endpoint is unconfigured');
    return { sent: 0, failed: 0, exhausted: 0 };
  }
  const snapshot = await db.collection('store_analysis_reports')
    .where('delivery.status', 'in', ELIGIBLE)
    .orderBy('createdAt', 'asc')
    .limit(SCAN_LIMIT)
    .get();
  const counters = { sent: 0, failed: 0, exhausted: 0 };

  async function processDoc(doc) {
    const claim = await db.runTransaction(async tx => {
      const current = await tx.get(doc.ref);
      if (!current.exists) return null;
      const record = current.data() || {};
      const job = record.delivery || {};
      if (!ELIGIBLE.includes(job.status)) return null;
      const attempts = Number.isInteger(job.attempts) ? job.attempts : 0;
      if (attempts >= MAX_RETRIES || !job.email || !job.storeUrl || !record.result ||
          (millis(record.expiresAt) > 0 && millis(record.expiresAt) <= now)) {
        tx.update(doc.ref, {
          'delivery.status': 'exhausted',
          'delivery.updatedAt': FieldValue.serverTimestamp(),
        });
        return { terminal: true };
      }
      const last = millis(job.lastAttemptAt) || millis(record.createdAt);
      if (!last || now - last < STALE_MS) return null;
      tx.update(doc.ref, {
        'delivery.status': 'retrying',
        'delivery.attempts': FieldValue.increment(1),
        'delivery.lastAttemptAt': FieldValue.serverTimestamp(),
        'delivery.updatedAt': FieldValue.serverTimestamp(),
      });
      return { record, attempt: attempts + 1 };
    });
    if (!claim) return;
    if (claim.terminal) {
      counters.exhausted++;
      return;
    }
    let delivered = false;
    try {
      const response = await fetchImpl(deliveryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Analyzer-Delivery-Key': deliveryKey },
        body: JSON.stringify(buildPayload(doc.id, claim.record)),
        signal: AbortSignal.timeout(120000),
      });
      if (!response.ok) throw new Error('Report delivery HTTP ' + response.status);
      delivered = true;
    } catch (error) {
      logger.error('[Analyzer retry] Delivery failed', doc.id, error?.message || error);
    }

    await db.runTransaction(async tx => {
      const current = await tx.get(doc.ref);
      if (!current.exists || current.data()?.delivery?.status !== 'retrying') return;
      tx.update(doc.ref, {
        'delivery.status': delivered ? 'sent' :
          claim.attempt >= MAX_RETRIES ? 'exhausted' : 'failed',
        'delivery.updatedAt': FieldValue.serverTimestamp(),
      });
    });
    if (delivered) counters.sent++;
    else if (claim.attempt >= MAX_RETRIES) counters.exhausted++;
    else counters.failed++;
  }

  // Claim at most nine documents; at most three requests in flight so even
  // slow PDF generation stays below the 540-second scheduled-job timeout.
  const candidates = snapshot.docs.filter(doc => {
    const record = doc.data() || {};
    const job = record.delivery || {};
    return job.attempts >= MAX_RETRIES ||
      ((millis(job.lastAttemptAt) || millis(record.createdAt)) > 0 &&
       now - (millis(job.lastAttemptAt) || millis(record.createdAt)) >= STALE_MS);
  }).slice(0, MAX_PER_RUN);
  for (let i = 0; i < candidates.length; i += MAX_CONCURRENT) {
    await Promise.all(candidates.slice(i, i + MAX_CONCURRENT).map(processDoc));
  }
  return counters;
}

module.exports = { retryAnalysisReports, buildPayload, millis };
