'use strict';

const { createHash } = require('node:crypto');

/**
 * Shared-instance rate limiter using Firestore transactions.
 * Fails closed: a persistence outage never silently disables abuse protection.
 */
async function checkFirestoreRateLimit(db, key, maxRequests, windowMs, now = Date.now()) {
  if (!Number.isInteger(maxRequests) || maxRequests < 1 ||
      !Number.isFinite(windowMs) || windowMs <= 0) {
    throw new Error('Invalid rate-limit configuration');
  }
  const id = createHash('sha256').update(key).digest('hex');
  const ref = db.collection('rate_limits').doc(id);
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const state = snapshot.exists ? snapshot.data() || {} : {};
    const expired = !snapshot.exists || typeof state.resetTime !== 'number' || state.resetTime <= now;
    if (expired) {
      transaction.set(ref, { count: 1, resetTime: now + windowMs });
      return true;
    }
    if ((state.count || 0) >= maxRequests) return false;
    transaction.update(ref, { count: state.count + 1 });
    return true;
  });
}

module.exports = { checkFirestoreRateLimit };
