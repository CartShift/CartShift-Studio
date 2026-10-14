/* eslint-disable @typescript-eslint/no-require-imports */
/* global require, console, process */
// Firestore Emulator security tests: no production Firebase credentials used.
const fs = require('node:fs');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');

async function main() {
  const env = await initializeTestEnvironment({
    projectId: 'demo-cartshift',
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
    storage: { rules: fs.readFileSync('storage.rules', 'utf8') },
  });

  const context = (uid, email) =>
    env.authenticatedContext(uid, { email }).firestore();
  try {
    await env.withSecurityRulesDisabled(async admin => {
      const db = admin.firestore();
      await Promise.all([
        db.doc('portal_users/agency').set({ accountType: 'AGENCY', isAgency: true, email: 'staff@example.com' }),
        db.doc('portal_users/client').set({ accountType: 'CLIENT', isAgency: false, email: 'client@example.com' }),
        db.doc('portal_users/outsider').set({ accountType: 'CLIENT', isAgency: false, email: 'outsider@example.com' }),
        db.doc('portal_users/removed').set({ accountType: 'CLIENT', isAgency: false, email: 'removed@example.com' }),
        db.doc('portal_users/viewer').set({ accountType: 'AGENCY', isAgency: true, agencyRole: 'viewer', email: 'viewer@example.com' }),
        db.doc('portal_users/developer').set({ accountType: 'AGENCY', isAgency: true, agencyRole: 'developer', email: 'developer@example.com' }),
        db.doc('portal_organizations/orgA').set({ name: 'A', createdBy: 'agency' }),
        db.doc('portal_organizations/orgB').set({ name: 'B', createdBy: 'agency' }),
        db.doc('portal_members/orgA_client').set({ orgId: 'orgA', userId: 'client', email: 'client@example.com', role: 'member' }),
        db.doc('portal_members/orgA_removed').set({ orgId: 'orgA', userId: 'removed', email: 'removed@example.com', role: 'admin', removedAt: require('firebase/firestore').Timestamp.now() }),
        db.doc('portal_requests/reqA').set({ orgId: 'orgA', title: 'Request', status: 'NEW' }),
        db.doc('portal_comments/publicA').set({
          orgId: 'orgA', requestId: 'reqA', isInternal: false,
          userId: 'client', content: 'Public comment',
        }),
        db.doc('portal_comments/internalA').set({
          orgId: 'orgA', requestId: 'reqA', isInternal: true,
          userId: 'agency', content: 'Agency confidential information',
        }),
        db.doc('portal_projects/prjA').set({
          orgId: 'orgA',
          title: 'Theme review',
          reviewRevisions: { hero: 2, 'change:extra': 1 },
          stages: [], blockers: [], deliverables: [],
          changes: [],
        }),
      ]);
    });

    const agency = context('agency', 'staff@example.com');
    const client = context('client', 'client@example.com');
    const outsider = context('outsider', 'outsider@example.com');
    const removed = context('removed', 'removed@example.com');
    const viewer = context('viewer', 'viewer@example.com');
    const developer = context('developer', 'developer@example.com');

    // Internal comments must be protected by Firestore rules, not client-side filtering.
    await assertSucceeds(client.doc('portal_comments/publicA').get());
    await assertFails(client.doc('portal_comments/internalA').get());
    await assertFails(outsider.doc('portal_comments/publicA').get());
    await assertSucceeds(agency.doc('portal_comments/internalA').get());
    await assertFails(client.collection('portal_comments')
      .where('orgId', '==', 'orgA').where('requestId', '==', 'reqA')
      .where('isInternal', '==', false).get());
    await assertFails(client.collection('portal_comments')
      .where('orgId', '==', 'orgA').where('requestId', '==', 'reqA').get());
    await assertSucceeds(agency.collection('portal_comments')
      .where('orgId', '==', 'orgA').get());
    await assertFails(client.doc('portal_comments/publicA').update({ isInternal: true }));
    await assertFails(client.doc('portal_comments/internalA').update({ content: 'Tampered' }));
    await assertFails(client.collection('portal_comments').add({
      orgId: 'orgA', requestId: 'reqA', userId: 'client', isInternal: true,
      content: 'Forged confidential note',
    }));
    await assertSucceeds(client.doc('portal_projects/prjA').get());
    await assertFails(outsider.doc('portal_projects/prjA').get());
    await assertFails(client.doc('portal_projects/prjA').update({ title: 'Forged' }));
    await assertFails(client.collection('portal_projects').add({ orgId: 'orgA', title: 'Injected' }));
    await assertSucceeds(agency.collection('portal_projects').add({ orgId: 'orgA', title: 'Legitimate' }));
    await assertFails(outsider.collection('portal_projects').where('orgId', '==', 'orgA').get());
    // Revoking a member must revoke Firestore access even when the membership document remains.
    await assertFails(removed.doc('portal_projects/prjA').get());
    await assertFails(removed.doc('portal_organizations/orgA').get());
    await assertFails(removed.doc('portal_comments/publicA').get());
    await assertFails(removed.doc('portal_requests/reqA').update({ title: 'Unauthorized' }));
    await assertFails(viewer.doc('portal_projects/prjA').update({ title: 'Unauthorized viewer edit' }));
    await assertFails(viewer.collection('portal_projects').add({ orgId: 'orgA', title: 'Unauthorized viewer project' }));
    await assertSucceeds(developer.doc('portal_projects/prjA').update({ title: 'Authorized developer edit' }));
    await assertFails(viewer.collection('portal_requests').add({ orgId: 'orgA', title: 'Viewer request' }));
    await assertFails(developer.doc('portal_requests/reqA').update({ totalAmount: 1 }));

    await assertFails(client.doc('portal_users/client').update({ isAgency: true, accountType: 'AGENCY' }));
    await assertFails(client.doc('portal_users/client').update({ agencyRole: 'owner' }));
    await assertFails(client.doc('portal_members/orgB_client').set({
      orgId: 'orgB', userId: 'client', role: 'owner',
    }));

    const baseReview = {
      projectId: 'prjA', orgId: 'orgA', deliverableId: 'hero', reviewerId: 'client',
      revision: 2, decision: 'approved', comment: 'Looks good',
      updatedAt: null,
    };
    // The compat SDK supplies serverTimestamp() as a transform; rules see request.time.
    const { serverTimestamp } = require('firebase/firestore');
    const review = { ...baseReview, updatedAt: serverTimestamp() };
    await assertSucceeds(client.doc('portal_projects/prjA/reviews/hero_client').set(review));
    await assertFails(client.doc('portal_projects/prjA/reviews/hero_wrong').set(review));
    await assertFails(client.doc('portal_projects/prjA/reviews/hero_client').set({ ...review, revision: 1 }));
    await assertFails(outsider.doc('portal_projects/prjA/reviews/hero_outsider').set({
      ...review, reviewerId: 'outsider',
    }));
    await assertFails(agency.doc('portal_projects/prjA/reviews/hero_agency').set({
      ...review, reviewerId: 'agency',
    }));

    // Client may only acknowledge a genuine invitation, never change its target role.
    await assertSucceeds(agency.doc('portal_invites/staff-invite').set({
      orgId: null, isAgency: true, role: 'developer', status: 'pending',
      email: 'outsider@example.com', invitedBy: 'agency',
      expiresAt: require('firebase/firestore').Timestamp.fromDate(new Date(Date.now() + 3600_000)),
    }));
    await assertFails(outsider.doc('portal_invites/staff-invite').update({ role: 'owner' }));
    await assertFails(outsider.collection('portal_invites').get());
    await assertFails(viewer.collection('portal_invites').get());
    await assertFails(viewer.doc('portal_invites/staff-invite').update({ role: 'owner' }));
    await assertFails(env.unauthenticatedContext().firestore().doc('portal_invites/staff-invite').get());
    await assertSucceeds(outsider.doc('portal_invites/staff-invite').get());
    await assertSucceeds(outsider.doc('portal_users/outsider').update({
      accountType: 'AGENCY', isAgency: true, agencyRole: 'developer',
      agencyInviteId: 'staff-invite',
    }));
    // Storage must enforce the same revocation semantics as Firestore.
    const bucket = 'gs://demo-cartshift.appspot.com';
    const activeFile = client.storage(bucket).ref('portal/orgA/active-member.txt');
    await assertSucceeds(activeFile.putString('allowed'));
    await assertSucceeds(agency.storage(bucket).ref('portal/orgA/active-member.txt').getMetadata());
    await assertFails(removed.storage(bucket).ref('portal/orgA/active-member.txt').getMetadata());
    await assertFails(removed.storage(bucket).ref('portal/orgA/revoked-member.txt').putString('denied'));
    await assertFails(removed.storage(bucket).ref('org-logos/orgA/revoked-admin.png').putString('denied', 'raw', { contentType: 'image/png' }));
    await assertFails(outsider.storage(bucket).ref('portal/orgA/active-member.txt').getMetadata());
    console.log('Firestore and Storage security scenarios passed');
  } finally {
    await env.cleanup();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
