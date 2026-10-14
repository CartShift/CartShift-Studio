/**
 * Read-only structural reconciliation for Projects <-> Requests <-> Proposals.
 *
 * Example:
 *   pnpm audit:portal:projects --project=<staging-project-id> --max-docs=2000
 *
 * Does not accept --apply and never alters customers, payments or projects.
 */
import * as admin from 'firebase-admin';
import { inspectProjectDocumentGrowth } from '@/lib/domain/project-document-growth';

const MAX = 20000;
function args() {
  if (process.argv.some(arg => ['--apply', '--write', '--fix'].includes(arg))) {
    throw new Error('This audit is read-only.');
  }
  const projectId = process.argv.find(arg => arg.startsWith('--project='))?.slice(10);
  const count = Number(process.argv.find(arg => arg.startsWith('--max-docs='))?.slice(11) || 2000);
  if (!projectId || !/^[a-z0-9][a-z0-9-]{3,63}$/i.test(projectId)) {
    throw new Error('Specify --project=<firebase-project-id>.');
  }
  if (!Number.isSafeInteger(count) || count < 1 || count > MAX) {
    throw new Error('--max-docs must be between 1 and 20000.');
  }
  const configured = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  if (configured && configured !== projectId) throw new Error('Firebase project does not match the environment.');
  return { projectId, count };
}

async function scan(db: admin.firestore.Firestore, collection: string, max: number) {
  const rows: Array<{ id: string; data: admin.firestore.DocumentData }> = [];
  let cursor: admin.firestore.QueryDocumentSnapshot | undefined;
  while (rows.length < max) {
    let query = db.collection(collection).orderBy(admin.firestore.FieldPath.documentId()).limit(
      Math.min(200, max - rows.length),
    );
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) break;
    rows.push(...page.docs.map(doc => ({ id: doc.id, data: doc.data() })));
    cursor = page.docs.at(-1);
    if (page.size < 200) break;
  }
  return rows;
}

async function main() {
  const { projectId, count } = args();
  if (!admin.apps.length) {
    const credential = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
      : admin.credential.applicationDefault();
    admin.initializeApp({ projectId, credential });
  }
  const db = admin.firestore();
  const [requests, projects] = await Promise.all([
    scan(db, 'portal_requests', count),
    scan(db, 'portal_projects', count),
  ]);
  const projectById = new Map(projects.map(item => [item.id, item.data]));
  const requestById = new Map(requests.map(item => [item.id, item.data]));
  const problems: Array<{ code: string; requestId?: string; projectId?: string }> = [];

  for (const request of requests) {
    const row = request.data;
    const commercial = row.isBillable === true || !!row.publicToken || row.requestRole === 'bundle';
    if (row.projectId) {
      const project = projectById.get(row.projectId);
      if (!project) problems.push({ code: 'UNRESOLVED_PROJECT_LINK', requestId: request.id, projectId: row.projectId });
      else if (project.orgId !== row.orgId) problems.push({ code: 'CROSS_ORGANIZATION_LINK', requestId: request.id, projectId: row.projectId });
    }
    if (commercial && ['ACCEPTED', 'PAID'].includes(row.status) && !row.projectId) {
      problems.push({ code: 'APPROVED_PROPOSAL_WITHOUT_PROJECT', requestId: request.id });
    }
    if (row.parentRequestId) {
      const parent = requestById.get(row.parentRequestId);
      if (parent && (parent.orgId !== row.orgId ||
        (parent.projectId && parent.projectId !== row.projectId))) {
        problems.push({ code: 'CHILD_PROJECT_MISMATCH', requestId: request.id });
      }
    }
  }

  const documentGrowth: Array<{ projectId: string; estimatedJsonBytes: number; collectionCounts: ReturnType<typeof inspectProjectDocumentGrowth>['collectionCounts']; largestEmbeddedCollection: ReturnType<typeof inspectProjectDocumentGrowth>['largestEmbeddedCollection'] }> = [];

  for (const project of projects) {
    const data = project.data;
    try {
      const growth = inspectProjectDocumentGrowth(data);
      documentGrowth.push({
        projectId: project.id,
        estimatedJsonBytes: growth.estimatedJsonBytes,
        collectionCounts: growth.collectionCounts,
        largestEmbeddedCollection: growth.largestEmbeddedCollection,
      });
      if (growth.caution) problems.push({ code: 'PROJECT_DOCUMENT_SIZE_CAUTION', projectId: project.id });
    } catch {
      // Keep the read-only audit usable even when a legacy document is malformed.
      // Report only the document ID, never dump customer content into logs.
      problems.push({ code: 'PROJECT_DOCUMENT_SHAPE_INVALID', projectId: project.id });
    }
    if (data.originProposalId) {
      const proposal = requestById.get(data.originProposalId);
      if (!proposal || proposal.orgId !== data.orgId) {
        problems.push({ code: 'INVALID_ORIGIN_PROPOSAL', projectId: project.id });
      }
    }
    const scope = data.scope || {};
    if (data.linkedProposalIds?.length && !(scope.maxHours > 0 || scope.rateCents > 0)) {
      problems.push({ code: 'PROJECT_SCOPE_REQUIRES_REVIEW', projectId: project.id });
    }
  }
  console.log(JSON.stringify({
    firebaseProject: projectId,
    auditedRequests: requests.length, auditedProjects: projects.length,
    truncated: requests.length === count || projects.length === count,
    issueCount: problems.length,
    projectDocumentGrowth: {
      note: 'Approximate UTF-8 JSON sizes, not Firestore-encoded bytes; per-field overhead is excluded. Verify large documents before planning a subcollection migration.',
      cautions: problems.filter(item => item.code === 'PROJECT_DOCUMENT_SIZE_CAUTION').length,
      topTenByEstimatedJsonBytes: documentGrowth
        .sort((a, b) => b.estimatedJsonBytes - a.estimatedJsonBytes)
        .slice(0, 10),
    },
    byCode: problems.reduce<Record<string, number>>((acc, issue) => {
      acc[issue.code] = (acc[issue.code] || 0) + 1;
      return acc;
    }, {}),
    issues: problems.slice(0, 100),
    readOnly: true,
  }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
