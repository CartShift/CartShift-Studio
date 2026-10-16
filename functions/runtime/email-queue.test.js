'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createEmailQueueWorker } = require('./email-queue');

function harness(start = 1_000_000) {
  const jobs = new Map();
  const sends = [];
  let clock = start;
  let mutex = Promise.resolve();
  let responder = async () => ({ success: true, id: 'provider-id' });
  const toTimestamp = ms => ({ toMillis: () => ms });
  const DELETE = Symbol('delete');
  const FieldValue = {
    serverTimestamp: () => toTimestamp(clock),
    delete: () => DELETE,
  };
  function update(ref, changes) {
    const data = jobs.get(ref.id);
    for (const [key, value] of Object.entries(changes)) {
      if (value === DELETE) delete data[key];
      else data[key] = value;
    }
  }
  const db = {
    collection: name => {
      assert.equal(name, 'email_queue');
      // Firestore Query.where() is immutable; different recovery queries must
      // not share filter state in the test adapter.
      const query = filters => ({
        where: (field, op, value) => query([...filters, [field, op, value]]),
        limit: count => ({ get: async () => {
          const matched = [...jobs.entries()]
            .filter(([, row]) => filters.every(([field, op, value]) => {
              if (op === '==') return row[field] === value;
              if (op === '<=') return row[field]?.toMillis?.() <= value.toMillis();
              throw new Error('unsupported query');
            }))
            .slice(0, count)
            .map(([id]) => ({ ref: ref(id) }));
          return { docs: matched };
        } }),
      });
      return query([]);
    },
    runTransaction: async callback => {
      let release;
      const prior = mutex;
      mutex = new Promise(resolve => { release = resolve; });
      await prior;
      const writes = [];
      try {
        const result = await callback({
          get: async reference => ({
            exists: jobs.has(reference.id),
            data: () => ({ ...jobs.get(reference.id) }),
          }),
          update: (reference, changes) => writes.push([reference, changes]),
        });
        for (const [reference, changes] of writes) update(reference, changes);
        return result;
      } finally {
        release();
      }
    },
  };
  const firestore = () => db;
  firestore.FieldValue = FieldValue;
  firestore.Timestamp = { fromMillis: toTimestamp };
  const sendPortalEmail = async (...args) => {
    sends.push(args);
    return responder(...args);
  };
  const worker = createEmailQueueWorker({
    admin: { firestore },
    sendPortalEmail,
    supportedTemplates: ['contact_form_notification'],
    now: () => clock,
  });
  function ref(id) {
    return { id, update: async changes => update(ref(id), changes) };
  }
  return {
    jobs, sends, worker, ref,
    setTime: value => { clock = value; },
    setResponder: value => { responder = value; },
  };
}

const pending = () => ({
  status: 'pending', templateName: 'contact_form_notification',
  to: 'agency@example.test', subject: 'Contact request', data: { name: 'Customer' },
});

test('two concurrent deliveries claim only once and reuse a stable provider key', async () => {
  const h = harness();
  h.jobs.set('mail-1', pending());
  await Promise.all([
    h.worker.processPending(h.ref('mail-1'), 'mail-1'),
    h.worker.processPending(h.ref('mail-1'), 'mail-1'),
  ]);
  assert.equal(h.sends.length, 1);
  assert.equal(h.sends[0][4].uniqueId, 'mail-1');
  assert.equal(h.jobs.get('mail-1').status, 'sent');
  assert.equal(h.jobs.get('mail-1').attempts, 1);
});

test('transient provider failure retries only after due time', async () => {
  const h = harness();
  h.jobs.set('mail-2', pending());
  h.setResponder(async () => ({ success: false, error: 'provider unavailable' }));
  await h.worker.processPending(h.ref('mail-2'), 'mail-2');
  assert.equal(h.jobs.get('mail-2').status, 'failed');
  const due = h.jobs.get('mail-2').retryAfter.toMillis();
  assert.equal(due, 1_300_000);
  await h.worker.recover();
  assert.equal(h.jobs.get('mail-2').status, 'failed');
  h.setTime(due);
  await h.worker.recover();
  assert.equal(h.jobs.get('mail-2').status, 'pending');
  h.setResponder(async () => ({ success: true, id: 'ok' }));
  await h.worker.processPending(h.ref('mail-2'), 'mail-2');
  assert.equal(h.jobs.get('mail-2').status, 'sent');
  assert.equal(h.jobs.get('mail-2').attempts, 2);
  assert.deepEqual(h.sends.map(args => args[4].uniqueId), ['mail-2', 'mail-2']);
});

test('exhausted attempts never schedule another retry', async () => {
  const h = harness();
  h.jobs.set('mail-3', { ...pending(), attempts: 2 });
  h.setResponder(async () => ({ success: false, error: 'provider down' }));
  await h.worker.processPending(h.ref('mail-3'), 'mail-3');
  assert.equal(h.jobs.get('mail-3').status, 'failed');
  assert.equal(h.jobs.get('mail-3').attempts, 3);
  assert.equal(h.jobs.get('mail-3').retryAfter, undefined);
  h.setTime(9_000_000);
  await h.worker.recover();
  assert.equal(h.jobs.get('mail-3').status, 'failed');
});

test('unsupported template fails permanently without contacting provider', async () => {
  const h = harness();
  h.jobs.set('mail-4', { ...pending(), templateName: 'unknown-template' });
  await h.worker.processPending(h.ref('mail-4'), 'mail-4');
  assert.equal(h.jobs.get('mail-4').status, 'failed');
  assert.equal(h.jobs.get('mail-4').retryAfter, undefined);
  assert.equal(h.sends.length, 0);
});

test('stale processing job is recovered; terminal failures do not starve it', async () => {
  const h = harness(10_000_000);
  for (let i = 0; i < 300; i++) {
    h.jobs.set(`old-${i}`, { ...pending(), status: 'failed', attempts: 3 });
  }
  h.jobs.set('stale', {
    ...pending(), status: 'processing', attempts: 1,
    processingStartedAt: { toMillis: () => 6_000_000 },
  });
  await h.worker.recover();
  assert.equal(h.jobs.get('stale').status, 'pending');
  assert.equal(h.jobs.get('old-0').status, 'failed');
});

test('recovery processes a pending job whose original trigger never claimed it', async () => {
  const h = harness();
  h.jobs.set('missed-trigger', pending());
  await h.worker.recover();
  assert.equal(h.jobs.get('missed-trigger').status, 'sent');
  assert.equal(h.sends.length, 1);
});

test('pending recovery remains bounded and cannot double-claim a concurrent trigger', async () => {
  const h = harness();
  for (let i = 0; i < 30; i++) h.jobs.set('pending-' + i, pending());
  await h.worker.recover();
  assert.equal(h.sends.length, 25);
  assert.equal([...h.jobs.values()].filter(job => job.status === 'pending').length, 5);
  await Promise.all([h.worker.recover(), h.worker.processPending(h.ref('pending-25'), 'pending-25')]);
  assert.equal(h.sends.length, 30);
});
