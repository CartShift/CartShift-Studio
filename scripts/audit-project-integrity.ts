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
import { resolveAuditReference } from '@/lib/domain/project-audit-coverage';

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
  const base = db.collection(collection).orderBy(admin.firestore.FieldPath.documentId());
  let cursor: admin.firestore.QueryDocumentSnapshot | undefined;
  while (rows.length < max) {
    const take = Math.min(200, max - rows.length);
    const page = await (cursor ? base.startAfter(cursor) : base).limit(take).get();
    if (page.empty) return { rows, complete: true };
    rows.push(...page.docs.map(doc => ({ id: doc.id, data: doc.data() })));
    cursor = page.docs.at(-1);
    if (page.size < take) return { rows, complete: true };
  }
  // One read proves whether the cap really truncated a collection; reaching
  // the cap alone is not evidence of unseen documents.
  const next = await base.startAfter(cursor!).limit(1).get();
  return { rows, complete: next.empty };
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
  const [requestScan, projectScan] = await Promise.all([
    scan(db, 'portal_requests', count),
    scan(db, 'portal_projects', count),
  ]);
  const requests = requestScan.rows;
  const projects = projectScan.rows;
  const unverifiedLinks = { projectLinks: 0, originProposals: 0, parentRequests: 0 };
  const projectById = new Map(projects.map(item => [item.id, item.data]));
  const requestById = new Map(requests.map(item => [item.id, item.data]));
  const problems: Array<{ code: string; requestId?: string; projectId?: string }> = [];

  for (const request of requests) {
    const row = request.data;
    const commercial = row.isBillable === true || !!row.publicToken || row.requestRole === 'bundle';
    if (row.projectId) {
      const target = resolveAuditReference(String(row.projectId), projectById, projectScan.complete);
      if (target.status === 'missing') {
        problems.push({ code: 'UNRESOLVED_PROJECT_LINK', requestId: request.id, projectId: row.projectId });
      } else if (target.status === 'unverified') {
        unverifiedLinks.projectLinks++;
      } else if (target.value.orgId !== row.orgId) {
        problems.push({ code: 'CROSS_ORGANIZATION_LINK', requestId: request.id, projectId: row.projectId });
      }
    }
    if (commercial && ['ACCEPTED', 'PAID'].includes(row.status) && !row.projectId) {
      problems.push({ code: 'APPROVED_PROPOSAL_WITHOUT_PROJECT', requestId: request.id });
    }
    if (row.parentRequestId) {
      const parent = resolveAuditReference(String(row.parentRequestId), requestById, requestScan.complete);
      if (parent.status === 'unverified') unverifiedLinks.parentRequests++;
      if (parent.status === 'found' && (parent.value.orgId !== row.orgId ||
        (parent.value.projectId && parent.value.projectId !== row.projectId))) {
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
      const proposal = resolveAuditReference(String(data.originProposalId), requestById, requestScan.complete);
      if (proposal.status === 'unverified') {
        unverifiedLinks.originProposals++;
      } else if (proposal.status === 'missing' || proposal.value.orgId !== data.orgId) {
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
    truncated: !requestScan.complete || !projectScan.complete,
    scanCoverage: {
      requests: { inspected: requests.length, complete: requestScan.complete },
      projects: { inspected: projects.length, complete: projectScan.complete },
      unverifiedLinks,
      note: 'Unseen references in truncated scans are unverified, not necessarily broken. Increase --max-docs or validate individually before making changes.',
    },
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
