/* eslint-disable @typescript-eslint/no-require-imports */
/* global require */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { checkFirestoreRateLimit } = require('../../functions/rate-limit');

function fakeFirestore() {
  const rows = new Map();
  return {
    rows,
    collection(name) {
      assert.equal(name, 'rate_limits');
      return { doc: id => ({ id }) };
    },
    runTransaction(fn) {
      const tx = {
        get: async ref => ({
          exists: rows.has(ref.id),
          data: () => rows.get(ref.id),
        }),
        set: (ref, value) => rows.set(ref.id, value),
        update: (ref, value) => rows.set(ref.id, { ...rows.get(ref.id), ...value }),
      };
      return fn(tx);
    },
  };
}

test('blocks globally after the configured limit, then resets the time window', async () => {
  const db = fakeFirestore();
  assert.equal(await checkFirestoreRateLimit(db, 'contact:1', 2, 1000, 100), true);
  assert.equal(await checkFirestoreRateLimit(db, 'contact:1', 2, 1000, 101), true);
  assert.equal(await checkFirestoreRateLimit(db, 'contact:1', 2, 1000, 102), false);
  assert.equal(await checkFirestoreRateLimit(db, 'contact:1', 2, 1000, 1100), true);
});

test('keeps separate rate-limit scopes isolated', async () => {
  const db = fakeFirestore();
  assert.equal(await checkFirestoreRateLimit(db, 'contact:1', 1, 1000, 10), true);
  assert.equal(await checkFirestoreRateLimit(db, 'contact:1', 1, 1000, 11), false);
  assert.equal(await checkFirestoreRateLimit(db, 'newsletter:1', 1, 1000, 11), true);
});

test('rejects invalid configuration without persisting a record', async () => {
  const db = fakeFirestore();
  await assert.rejects(() => checkFirestoreRateLimit(db, 'x', 0, 1000, 10));
  assert.equal(db.rows.size, 0);
});

test('does not fail open if Firestore is unavailable', async () => {
  const db = {
    collection: () => ({ doc: id => ({ id }) }),
    runTransaction: async () => { throw new Error('firestore-unavailable'); },
  };
  await assert.rejects(
    () => checkFirestoreRateLimit(db, 'contact:1', 2, 1000, 10),
    /firestore-unavailable/
  );
});
