/**
 * Read-only privacy audit for historical portal_requests.lastComment previews.
 * Deliberately has no --apply implementation and never outputs comment text.
 *
 * Run: pnpm audit:portal:private-previews --project=<staging-project-id> --max-docs=1000
 * Supply FIREBASE_SERVICE_ACCOUNT_KEY or Application Default Credentials.
 */
import * as admin from 'firebase-admin';
import { createHash } from 'node:crypto';
import { previewMayContainInternalComment } from '../lib/domain/internal-comment-preview-audit';

const DEFAULT_LIMIT = 1000;
const MAX_LIMIT = 20000;
const PAGE_SIZE = 100;

function getLimit(): number {
  if (process.argv.includes('--apply') || process.argv.includes('--write')) {
    throw new Error('This audit is strictly read-only; no write mode exists.');
  }
  const arg = process.argv.find(item => item.startsWith('--max-docs='));
  if (!arg) return DEFAULT_LIMIT;
  const value = Number(arg.slice('--max-docs='.length));
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_LIMIT) {
    throw new Error(`--max-docs must be an integer from 1 to ${MAX_LIMIT}`);
  }
  return value;
}

async function main() {
  const maxDocs = getLimit();
  // Explicit target prevents silently auditing a different Firebase project.
  const projectArgument = process.argv.find(arg => arg.startsWith('--project='));
  const projectId = projectArgument?.slice('--project='.length);
  if (!projectId || !/^[a-z0-9][a-z0-9-]{3,63}$/i.test(projectId)) {
    throw new Error('Pass an explicit Firebase project ID via --project=<project-id>.');
  }
  const configuredProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  if (configuredProject && configuredProject !== projectId) {
    throw new Error('The explicit Firebase project ID does not match the configured environment.');
  }
  if (!admin.apps.length) {
    const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const credential = credentials
      ? admin.credential.cert(JSON.parse(credentials))
      : admin.credential.applicationDefault();
    admin.initializeApp({ projectId, credential });
  }

  const database = admin.firestore();
  const seenRequests = new Map<string, Promise<admin.firestore.DocumentSnapshot>>();
  const candidateHashes = new Set<string>();
  let scanned = 0;
  let missingRequestRefs = 0;
  let cursor: admin.firestore.QueryDocumentSnapshot | null = null;
  let exhausted = false;

  while (scanned < maxDocs) {
    const remaining = Math.min(PAGE_SIZE, maxDocs - scanned);
    let query = database.collection('portal_comments')
      .where('isInternal', '==', true)
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(remaining);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    if (snapshot.empty) {
      exhausted = true;
      break;
    }

    for (const comment of snapshot.docs) {
      scanned++;
      const data = comment.data();
      const requestId = data.requestId;
      if (typeof requestId !== 'string' || !requestId || requestId.includes('/')) {
        missingRequestRefs++;
        continue;
      }

      let requestPromise = seenRequests.get(requestId);
      if (!requestPromise) {
        requestPromise = database.collection('portal_requests').doc(requestId).get();
        seenRequests.set(requestId, requestPromise);
      }
      const request = await requestPromise;
      if (!request.exists) {
        missingRequestRefs++;
        continue;
      }
      if (previewMayContainInternalComment(request.data()?.lastComment?.content, data.content)) {
        candidateHashes.add(createHash('sha256').update(requestId).digest('hex').slice(0, 16));
      }
    }

    cursor = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < remaining) {
      exhausted = true;
      break;
    }
  }

  // Hashes are for reviewer cross-checks; never log client IDs, emails or text.
  process.stdout.write(JSON.stringify({
    mode: 'read-only',
    projectId,
    scannedInternalComments: scanned,
    distinctRequestLookups: seenRequests.size,
    missingRequestRefs,
    possibleLeakedPreviews: candidateHashes.size,
    candidateRequestHashes: [...candidateHashes].sort(),
    incomplete: !exhausted,
    maxDocs,
  }, null, 2) + '\n');
}

main().catch(error => {
  console.error('[portal-private-preview-audit] Failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
