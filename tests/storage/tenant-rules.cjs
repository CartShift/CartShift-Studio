/* eslint-disable @typescript-eslint/no-require-imports */
/* global require, process, console */
// Storage security regression: only Firebase emulators, never production credentials.
const fs = require('node:fs');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { ref, uploadBytes, getMetadata, deleteObject } = require('firebase/storage');

async function main() {
  const env = await initializeTestEnvironment({
    projectId: 'demo-cartshift',
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
    storage: { rules: fs.readFileSync('storage.rules', 'utf8') },
  });

  try {
    await env.withSecurityRulesDisabled(async admin => {
      const db = admin.firestore();
      await Promise.all([
        db.doc('portal_users/storageAgency').set({
          accountType: 'AGENCY', isAgency: true, status: 'active',
        }),
        db.doc('portal_users/storageSuspended').set({
          accountType: 'AGENCY', isAgency: true, status: 'suspended',
        }),
        db.doc('portal_organizations/storageOrgA').set({
          name: 'Storage A', createdBy: 'storageOwner',
        }),
        db.doc('portal_organizations/storageOrgB').set({
          name: 'Storage B', createdBy: 'differentOwner',
        }),
        db.doc('portal_members/storageOrgA_storageClient').set({
          orgId: 'storageOrgA', userId: 'storageClient', role: 'member',
        }),
        db.doc('portal_members/storageOrgA_storageRevoked').set({
          orgId: 'storageOrgA', userId: 'storageRevoked', role: 'admin',
          removedAt: new Date(),
        }),
      ]);
    });

    const agency = env.authenticatedContext('storageAgency').storage();
    const suspended = env.authenticatedContext('storageSuspended').storage();
    const owner = env.authenticatedContext('storageOwner').storage();
    const member = env.authenticatedContext('storageClient').storage();
    const revoked = env.authenticatedContext('storageRevoked').storage();
    const outsider = env.authenticatedContext('storageOutsider').storage();
    const anonymous = env.unauthenticatedContext().storage();
    const path = 'portal/storageOrgA/evidence/secret.txt';
    const data = new Uint8Array([70, 105, 108, 101]);

    await assertSucceeds(uploadBytes(ref(owner, path), data, { contentType: 'text/plain' }));
    await assertSucceeds(getMetadata(ref(member, path)));
    await assertSucceeds(getMetadata(ref(agency, path)));
    await assertFails(getMetadata(ref(revoked, path)));
    await assertFails(getMetadata(ref(outsider, path)));
    await assertFails(getMetadata(ref(suspended, path)));
    await assertFails(getMetadata(ref(anonymous, path)));
    await assertFails(uploadBytes(ref(revoked, 'portal/storageOrgA/evidence/forged.txt'), data));
    await assertFails(uploadBytes(ref(outsider, 'portal/storageOrgA/evidence/forged.txt'), data));
    await assertFails(uploadBytes(ref(suspended, 'portal/storageOrgA/evidence/forged.txt'), data));
    await assertFails(uploadBytes(ref(member, 'portal/storageOrgB/evidence/forged.txt'), data));
    await assertFails(deleteObject(ref(revoked, path)));

    const logoPath = 'org-logos/storageOrgA/logo.png';
    const png = new Uint8Array([137, 80, 78, 71]);
    await assertSucceeds(uploadBytes(ref(owner, logoPath), png, { contentType: 'image/png' }));
    await assertFails(uploadBytes(ref(member, logoPath), png, { contentType: 'image/png' }));
    await assertFails(uploadBytes(ref(revoked, logoPath), png, { contentType: 'image/png' }));
    await assertFails(uploadBytes(ref(owner, logoPath), data, { contentType: 'text/plain' }));
    await assertSucceeds(getMetadata(ref(anonymous, logoPath)));
    console.log('Storage tenant security scenarios passed');
  } finally {
    await env.cleanup();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
