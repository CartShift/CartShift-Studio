'use strict';

/**
 * Durable email queue worker independent of the Firebase trigger transport.
 * One document represents one delivery intent; repeated trigger deliveries race
 * for a transaction claim. Provider idempotency always uses the document ID.
 */
function createEmailQueueWorker({ admin, sendPortalEmail, supportedTemplates, now = () => Date.now() }) {
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 5 * 60 * 1000;
  const serverTime = () => admin.firestore.FieldValue.serverTimestamp();
  const clearField = () => admin.firestore.FieldValue.delete();

  async function processPending(emailRef, jobId) {
    const claimed = await admin.firestore().runTransaction(async tx => {
      const snapshot = await tx.get(emailRef);
      if (!snapshot.exists) return null;
      const email = snapshot.data();
      const attempts = email.attempts || 0;
      if (email.status !== 'pending') return null;
      if (attempts >= MAX_ATTEMPTS) {
        tx.update(emailRef, {
          status: 'failed', error: 'max_attempts_exceeded',
          retryAfter: clearField(), updatedAt: serverTime(),
        });
        return null;
      }
      tx.update(emailRef, {
        status: 'processing',
        retryAfter: clearField(),
        attempts: attempts + 1,
        processingStartedAt: serverTime(),
        updatedAt: serverTime(),
      });
      return email;
    });
    if (!claimed) return;

    const attemptNumber = (claimed.attempts || 0) + 1;
    const mayRetry = attemptNumber < MAX_ATTEMPTS;
    try {
      if (!supportedTemplates.includes(claimed.templateName)) {
        throw new Error(`Unsupported email_queue templateName: ${claimed.templateName}`);
      }

      const result = await sendPortalEmail(
        claimed.to, claimed.subject, claimed.templateName, claimed.data,
        { tags: claimed.tags || [], uniqueId: jobId, scheduledAt: claimed.scheduledAt }
      );
      await emailRef.update({
        status: result.success ? 'sent' : 'failed',
        emailId: result.id || null,
        error: result.success ? null : result.error || 'send_failed',
        retryAfter: result.success || !mayRetry ? clearField()
          : admin.firestore.Timestamp.fromMillis(now() + RETRY_DELAY_MS),
        result,
        processedAt: serverTime(),
        updatedAt: serverTime(),
      });
    } catch (error) {
      const permanent = String(error.message || '').startsWith('Unsupported email_queue');
      console.error('[EmailQueue] Processing failed', jobId, error);
      await emailRef.update({
        status: 'failed',
        error: error.message || 'queue_processing_failed',
        retryAfter: !mayRetry || permanent ? clearField()
          : admin.firestore.Timestamp.fromMillis(now() + RETRY_DELAY_MS),
        processedAt: serverTime(),
        updatedAt: serverTime(),
      });
    }
  }

  async function recover() {
    const queue = admin.firestore().collection('email_queue');
    const currentTime = now();
    const cutoff = currentTime - 30 * 60 * 1000;
    // Query eligible jobs, not terminal failures. Composite indexes on status
    // and their respective timestamps must be deployed before this worker.
    const [abandoned, retries] = await Promise.all([
      queue.where('status', '==', 'processing')
        .where('processingStartedAt', '<=', admin.firestore.Timestamp.fromMillis(cutoff))
        .limit(100).get(),
      queue.where('status', '==', 'failed')
        .where('retryAfter', '<=', admin.firestore.Timestamp.fromMillis(currentTime))
        .limit(100).get(),
    ]);

    for (const doc of [...abandoned.docs, ...retries.docs]) {
      await admin.firestore().runTransaction(async tx => {
        const current = await tx.get(doc.ref);
        const data = current.data();
        if (!data) return;
        const abandonedJob = data.status === 'processing' &&
          data.processingStartedAt?.toMillis &&
          data.processingStartedAt.toMillis() <= cutoff;
        const dueRetry = data.status === 'failed' &&
          data.retryAfter?.toMillis && data.retryAfter.toMillis() <= currentTime &&
          (data.attempts || 0) > 0;
        if (!abandonedJob && !dueRetry) return;

        const exhausted = (data.attempts || 0) >= MAX_ATTEMPTS;
        tx.update(doc.ref, {
          status: exhausted ? 'failed' : 'pending',
          error: exhausted ? 'max_attempts_exceeded' : 'recovered_interrupted_attempt',
          retryAfter: clearField(),
          updatedAt: serverTime(),
        });
      });
    }
  }

  return { processPending, recover };
}

module.exports = { createEmailQueueWorker };
