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
        db.doc('portal_organizations/orgA').set({ name: 'A', createdBy: 'agency' }),
        db.doc('portal_organizations/orgB').set({ name: 'B', createdBy: 'agency' }),
        db.doc('portal_members/orgA_client').set({ orgId: 'orgA', userId: 'client', email: 'client@example.com', role: 'member' }),
        db.doc('portal_requests/reqA').set({ orgId: 'orgA', title: 'Request', status: 'NEW' }),
        db.doc('portal_requests/quoteA').set({
          orgId: 'orgA', title: 'Unpublished pricing',
          status: 'DRAFT', isBillable: true, publicAccessEnabled: false,
          agencyNotes: 'INTERNAL COMMERCIAL TERMS',
        }),
        db.doc('portal_requests/quoteSent').set({
          orgId: 'orgA', title: 'Sent pricing', status: 'QUOTED',
          isBillable: true, publicAccessEnabled: true,
          agencyNotes: 'NEVER EXPOSE', publishedProposal: { totalAmount: 200000 },
        }),
        db.doc('portal_pricing_requests/legacyQuote').set({
          orgId: 'orgA', status: 'SENT', agencyNotes: 'LEGACY PRIVATE',
        }),
        db.doc('portal_payments/privatePayment').set({
          orgId: 'orgA', amount: 200000, manualReference: 'PRIVATE BANK INFO',
        }),
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
          status: 'in_progress',
          reviewRevisions: { hero: 2, 'change:extra': 1 },
          stages: [], blockers: [], deliverables: [],
          changes: [],
        }),
        db.doc('portal_projects/prjB').set({
          orgId: 'orgB', title: 'Another client', status: 'planning',
        }),
      ]);
    });

    const agency = context('agency', 'staff@example.com');
    const client = context('client', 'client@example.com');
    const outsider = context('outsider', 'outsider@example.com');

    // Internal comments must be protected by Firestore rules, not client-side filtering.
    // Comments are also projected through the secure API, never returned raw.
    await assertFails(client.doc('portal_comments/publicA').get());
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
    await assertSucceeds(client.collection('portal_comments').add({
      orgId: 'orgA', requestId: 'reqA', userId: 'client',
      content: 'A real client comment', isInternal: false,
    }));
    await assertFails(client.collection('portal_comments').add({
      orgId: 'orgA', requestId: 'reqA', userId: 'agency',
      content: 'Forged staff response', isInternal: false,
    }));
    await assertFails(client.collection('portal_comments').add({
      orgId: 'orgA', requestId: 'quoteA', userId: 'client',
      content: 'Comment on a private draft', isInternal: false,
    }));
    await assertFails(client.collection('portal_comments').add({
      orgId: 'orgA', requestId: 'reqA', userId: 'client', isInternal: true,
      content: 'Forged confidential note',
    }));
    await assertSucceeds(client.doc('portal_projects/prjA').get());
    await assertFails(outsider.doc('portal_projects/prjA').get());
    await assertFails(client.doc('portal_projects/prjA').update({ title: 'Forged' }));
    await assertFails(client.collection('portal_projects').add({ orgId: 'orgA', title: 'Injected' }));
    await assertSucceeds(agency.collection('portal_projects').add({ orgId: 'orgA', title: 'Legitimate', status: 'planning' }));
    await assertFails(outsider.collection('portal_projects').where('orgId', '==', 'orgA').get());
    await assertFails(agency.doc('portal_projects/prjA').update({ status: 'ready_to_launch' }));
    await assertFails(agency.collection('portal_projects').add({
      orgId: 'orgA', title: 'Premature launch', status: 'ready_to_launch',
    }));

    // Commercial docs are agency-only. Members use the sanitized server API.
    await assertFails(client.doc('portal_requests/quoteA').get());
    await assertFails(client.doc('portal_requests/quoteSent').get());
    await assertSucceeds(agency.doc('portal_requests/quoteA').get());
    // Even ordinary requests can contain unpublished staff-only fields.
    // Client request data must always come from the sanitized server API.
    await assertFails(client.doc('portal_requests/reqA').get());
    await assertSucceeds(agency.doc('portal_requests/reqA').get());
    await assertFails(client.collection('portal_requests').where('orgId', '==', 'orgA').get());
    await assertFails(client.doc('portal_pricing_requests/legacyQuote').get());
    await assertFails(client.doc('portal_payments/privatePayment').get());
    await assertSucceeds(agency.doc('portal_payments/privatePayment').get());

    // Clients can create work only under projects owned by their organization.
    const { serverTimestamp } = require('firebase/firestore');
    await assertSucceeds(client.doc('portal_requests/validProjectTask').set({
      orgId: 'orgA', title: 'Task', description: 'Work', type: 'other',
      status: 'NEW', priority: 'NORMAL', projectId: 'prjA',
      requestRole: 'standalone', createdBy: 'client', createdByName: 'Client',
      tags: [], attachmentIds: [], commentCount: 0,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }));
    await assertSucceeds(client.doc('portal_requests/validProjectTask').update({
      description: 'Clarified request', updatedAt: serverTimestamp(),
    }));
    await assertFails(client.doc('portal_requests/validProjectTask').update({
      status: 'DELIVERED', updatedAt: serverTimestamp(),
    }));
    await assertFails(client.doc('portal_requests/validProjectTask').update({
      assignedTo: 'client', updatedAt: serverTimestamp(),
    }));
    await assertFails(client.doc('portal_requests/validProjectTask').update({
      createdBy: 'agency', updatedAt: serverTimestamp(),
    }));
    await assertFails(client.doc('portal_requests/impersonatedTask').set({
      orgId: 'orgA', title: 'Forged owner', status: 'NEW',
      requestRole: 'standalone', createdBy: 'agency',
    }));
    await assertFails(client.doc('portal_requests/crossOrgTask').set({
      orgId: 'orgA', title: 'Wrong project', description: 'Work',
      type: 'other', priority: 'NORMAL', status: 'NEW', projectId: 'prjB',
      requestRole: 'standalone', createdBy: 'client', createdByName: 'Client',
      tags: [], attachmentIds: [], commentCount: 0,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    }));
    await assertFails(client.doc('portal_requests/fakePaid').set({
      orgId: 'orgA', title: 'Commercial spoof', status: 'PAID', isBillable: true,
    }));

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
