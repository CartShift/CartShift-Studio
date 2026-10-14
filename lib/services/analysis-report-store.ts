import 'server-only';
import { randomBytes } from 'node:crypto';
import { adminDb } from '@/lib/firebase-admin';
import type { AnalysisResult } from '@/lib/types/analyzer';
import type { AnalyzerAttribution, AnalyzerIntent, PrimaryIssue } from '@/lib/analyzer/funnel';

export type StoredReportDelivery = {
  email: string;
  storeUrl: string;
  subscribeNewsletter: boolean;
  skipLeadCapture: boolean;
  intent?: AnalyzerIntent;
  attribution?: AnalyzerAttribution;
  primaryIssue?: PrimaryIssue;
};

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export async function storePrivateAnalysisReport(
  result: AnalysisResult,
  locale: string,
  delivery?: StoredReportDelivery
) {
  if (!adminDb || process.env.NODE_ENV === 'test') return null;
  const token = randomBytes(24).toString('base64url');
  const serializableResult = JSON.parse(JSON.stringify(result)) as AnalysisResult;
  await adminDb
    .collection('store_analysis_reports')
    .doc(token)
    .set({
      result: serializableResult,
      locale: locale === 'he' ? 'he' : 'en',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + RETENTION_MS),
      ...(delivery
        ? {
            delivery: {
              ...delivery,
              status: 'pending',
              attempts: 0,
              updatedAt: new Date(),
            },
          }
        : {}),
    });
  return token;
}

export async function getPrivateAnalysisReport(token: string) {
  if (!adminDb || !/^[A-Za-z0-9_-]{32}$/.test(token)) return null;
  const snapshot = await adminDb.collection('store_analysis_reports').doc(token).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data || data.expiresAt?.toDate?.().getTime() < Date.now()) return null;
  return data.result as AnalysisResult;
}


/** Called from the background handler. Failed updates must not disguise a sent email as a failure. */
export async function updatePrivateReportDelivery(
  token: string,
  status: 'sent' | 'failed'
): Promise<void> {
  if (!adminDb || !/^[A-Za-z0-9_-]{32}$/.test(token)) return;
  await adminDb.collection('store_analysis_reports').doc(token).update({
    'delivery.status': status,
    'delivery.updatedAt': new Date(),
    'delivery.lastAttemptAt': new Date(),
  });
}

export async function getPrivateReportDeliveryStatus(token: string) {
  if (!adminDb || !/^[A-Za-z0-9_-]{32}$/.test(token)) return null;
  const doc = await adminDb.collection('store_analysis_reports').doc(token).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data || data.expiresAt?.toDate?.().getTime() < Date.now()) return null;
  const state = data.delivery?.status;
  return state === 'sent' || state === 'failed' || state === 'pending' || state === 'retrying'
    ? state
    : 'unconfigured';
}
