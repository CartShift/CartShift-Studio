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
        db.doc('portal_users/revoked').set({ accountType: 'CLIENT', isAgency: false, email: 'revoked@example.com' }),
        db.doc('portal_organizations/orgA').set({ name: 'A', createdBy: 'agency' }),
        db.doc('portal_organizations/orgB').set({ name: 'B', createdBy: 'agency' }),
        db.doc('portal_members/orgA_client').set({ orgId: 'orgA', userId: 'client', email: 'client@example.com', role: 'member' }),
        db.doc('portal_members/orgA_revoked').set({ orgId: 'orgA', userId: 'revoked', role: 'member', removedAt: new Date() }),
        db.doc('portal_requests/reqA').set({ orgId: 'orgA', createdBy: 'revoked', clientEmail: 'revoked@example.com', title: 'Existing request' }),
        db.doc('portal_activities/logA').set({ orgId: 'orgA', userId: 'revoked', action: 'CREATED_REQUEST' }),
        db.doc('portal_billing_profiles/agency').set({ businessName: 'CartShift' }),
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
    const revoked = context('revoked', 'revoked@example.com');

    await assertSucceeds(client.doc('portal_projects/prjA').get());
    await assertFails(outsider.doc('portal_projects/prjA').get());
    await assertFails(client.doc('portal_projects/prjA').update({ title: 'Forged' }));
    await assertFails(client.collection('portal_projects').add({ orgId: 'orgA', title: 'Injected' }));
    await assertSucceeds(agency.collection('portal_projects').add({ orgId: 'orgA', title: 'Legitimate' }));
    await assertFails(outsider.collection('portal_projects').where('orgId', '==', 'orgA').get());

    // A soft-deleted membership revokes access even for request creators/email recipients.
    await assertFails(revoked.doc('portal_projects/prjA').get());
    await assertFails(revoked.doc('portal_organizations/orgA').get());
    await assertFails(revoked.doc('portal_requests/reqA').get());
    await assertFails(revoked.doc('portal_requests/reqA').update({ title: 'Forbidden' }));
    await assertFails(revoked.collection('portal_requests').add({ orgId: 'orgA', title: 'Forbidden' }));
    await assertFails(revoked.doc('portal_activities/logA').get());
    await assertFails(revoked.collection('portal_activities').add({ orgId: 'orgA', userId: 'revoked', action: 'CREATED_REQUEST' }));
    await assertFails(client.doc('portal_billing_profiles/agency').get());
    await assertSucceeds(agency.doc('portal_billing_profiles/agency').get());
    await assertSucceeds(client.collection('portal_activities').add({ orgId: 'orgA', userId: 'client', action: 'CREATED_REQUEST' }));
    await assertFails(client.collection('portal_activities').add({ orgId: 'orgB', userId: 'client', action: 'CREATED_REQUEST' }));
    await assertFails(client.collection('portal_activities').add({ orgId: 'orgA', userId: 'outsider', action: 'CREATED_REQUEST' }));

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
    await assertSucceeds(outsider.doc('portal_users/outsider').update({
      accountType: 'AGENCY', isAgency: true, agencyRole: 'developer',
      agencyInviteId: 'staff-invite',
    }));
    console.log('Firestore security scenarios passed');
  } finally {
    await env.cleanup();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
