import 'server-only';
import { createHash } from 'node:crypto';
import { adminDb } from '@/lib/firebase-admin';

export interface ServerRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkServerRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<ServerRateLimitResult> {
  if (!adminDb) {
    throw new Error('Firebase Admin is not configured');
  }

  const now = Date.now();
  const id = createHash('sha256').update(key).digest('hex');
  const ref = adminDb.collection('_server_rate_limits').doc(id);

  return adminDb.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    const windowStart = typeof data?.windowStart === 'number' ? data.windowStart : 0;
    const isExpired = !snapshot.exists || windowStart + windowMs <= now;

    if (isExpired) {
      transaction.set(ref, { count: 1, windowStart: now, updatedAt: now });
      return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
    }

    const count = typeof data?.count === 'number' ? data.count : 0;
    const resetAt = windowStart + windowMs;
    if (count >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt };
    }

    transaction.update(ref, { count: count + 1, updatedAt: now });
    return { allowed: true, remaining: maxRequests - count - 1, resetAt };
  });
}
