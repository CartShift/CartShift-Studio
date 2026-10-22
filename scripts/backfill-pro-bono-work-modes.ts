/**
 * Safely classify a known agency client and one existing project as Pro Bono.
 *
 * Dry run (default):
 *   pnpm exec tsx scripts/backfill-pro-bono-work-modes.ts --project=<firebase-project> --org-id=<id> --project-id=<id>
 * Apply requires --apply and --confirm-project-id=<same-id>.
 *
 * This script never changes historic prices, statuses, payments or invitations.
 * Relationship notes stay in an agency-only collection (never portal_organizations).
 */
import * as admin from 'firebase-admin';

type Arguments = {
  firebaseProject: string;
  orgId: string;
  projectId: string;
  apply: boolean;
};

function parseArguments(): Arguments {
  const option = (key: string) => process.argv.find(value => value.startsWith('--' + key + '='))?.slice(key.length + 3);
  const firebaseProject = option('project');
  const orgId = option('org-id');
  const projectId = option('project-id');
  const apply = process.argv.includes('--apply');
  const valid = (value: string | undefined) => Boolean(value && /^[a-zA-Z0-9_-]{6,128}$/.test(value));
  if (!valid(firebaseProject) || !valid(orgId) || !valid(projectId)) {
    throw new Error('Specify --project, --org-id and --project-id.');
  }
  if (apply && option('confirm-project-id') !== projectId) {
    throw new Error('Apply requires --confirm-project-id matching --project-id.');
  }
  const configured = process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (configured && configured !== firebaseProject) throw new Error('Configured Firebase project differs from --project.');
  return { firebaseProject: firebaseProject!, orgId: orgId!, projectId: projectId!, apply };
}

function commercial(row: FirebaseFirestore.DocumentData) {
  return row.isBillable === true || Boolean(row.publicToken) ||
    row.requestRole === 'bundle' || row.requestRole === 'bundle_item' ||
    Number(row.amountPaid || 0) > 0 || Number(row.balanceDue || 0) > 0;
}

async function main() {
  const args = parseArguments();
  if (!admin.apps.length) {
    const credential = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
      : admin.credential.applicationDefault();
    admin.initializeApp({ credential, projectId: args.firebaseProject });
  }
  const db = admin.firestore();
  const orgRef = db.collection('portal_organizations').doc(args.orgId);
  const projectRef = db.collection('portal_projects').doc(args.projectId);
  const metaRef = db.collection('agency_client_metadata').doc(args.orgId);
  const activityRef = db.collection('agency_work_mode_audit').doc();
  const relatedQuery = db.collection('portal_requests').where('projectId', '==', args.projectId).limit(201);

  const snapshot = await Promise.all([orgRef.get(), projectRef.get(), metaRef.get(), relatedQuery.get()]);
  const [org, project, meta, requests] = snapshot;
  if (!org.exists || !project.exists || project.data()?.orgId !== args.orgId) {
    throw new Error('Organization or project not found, or their IDs do not match.');
  }
  if (requests.size >= 201) throw new Error('Too many requests: refuse partial audit.');
  if (requests.docs.some(doc => commercial(doc.data()))) {
    throw new Error('Commercial work or payment already exists in this project. Manual reconciliation required.');
  }
  if ((project.data()?.scope?.rateCents || 0) !== 0) {
    throw new Error('Project has a non-zero hourly rate. Manual reconciliation required.');
  }
  if (meta.data()?.defaultWorkMode && meta.data()?.defaultWorkMode !== 'pro_bono') {
    throw new Error('Existing customer default conflicts with pro bono. Review before migrating.');
  }
  const report = {
    mode: args.apply ? 'apply' : 'dry_run',
    orgId: args.orgId,
    projectId: args.projectId,
    workItems: requests.size,
    oldClientMode: meta.data()?.defaultWorkMode ?? null,
    oldProjectMode: project.data()?.workMode ?? null,
    foundCommercial: false,
  };
  if (!args.apply) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  await db.runTransaction(async tx => {
    const [latestOrg, latestProject, latestMeta, latestRequests] = await Promise.all([
      tx.get(orgRef), tx.get(projectRef), tx.get(metaRef), tx.get(relatedQuery),
    ]);
    if (!latestOrg.exists || !latestProject.exists || latestProject.data()?.orgId !== args.orgId) {
      throw new Error('Organization/project changed.');
    }
    if (latestRequests.size >= 201 || latestRequests.docs.some(doc => commercial(doc.data()))) {
      throw new Error('Commercial data changed while migrating.');
    }
    if ((latestProject.data()?.scope?.rateCents || 0) !== 0) throw new Error('Rate changed while migrating.');
    const metaData = latestMeta.data();
    if (metaData?.defaultWorkMode && metaData.defaultWorkMode !== 'pro_bono') {
      throw new Error('Existing mode changed while migrating.');
    }
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    tx.set(metaRef, {
      defaultWorkMode: 'pro_bono',
      internalRelationshipNote: metaData?.internalRelationshipNote ||
        process.env.AGENCY_PRIVATE_RELATIONSHIP_NOTE || 'עבודה ללא תמורה בהסכמה מפורשת',
      updatedBy: 'authorized-migration-113',
      updatedAt: timestamp,
    }, { merge: true });
    tx.update(projectRef, { workMode: 'pro_bono', updatedAt: timestamp });
    tx.create(activityRef, {
      action: 'migration_pro_bono',
      actorUid: 'authorized-migration-113',
      orgId: args.orgId,
      projectId: args.projectId,
      oldClientMode: metaData?.defaultWorkMode ?? null,
      oldProjectMode: latestProject.data()?.workMode ?? null,
      createdAt: timestamp,
    });
  });

  const [afterMeta, afterProject] = await Promise.all([metaRef.get(), projectRef.get()]);
  if (afterMeta.data()?.defaultWorkMode !== 'pro_bono' ||
      afterProject.data()?.workMode !== 'pro_bono') {
    throw new Error('Migration write verification failed.');
  }
  console.log(JSON.stringify({ ...report, verified: true, newMode: 'pro_bono' }));
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
