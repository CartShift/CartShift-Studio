import 'server-only';
import { randomBytes } from 'node:crypto';
import { adminDb } from '@/lib/firebase-admin';
import type { AnalysisResult } from '@/lib/types/analyzer';

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export async function storePrivateAnalysisReport(result: AnalysisResult, locale: string) {
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
