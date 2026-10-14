/* eslint-disable @typescript-eslint/no-require-imports */
/* global require */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { retryAnalysisReports } = require('../../functions/analyzer/report-retry');

const DAY = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 9, 14);
const stamp = ms => ({ toMillis: () => ms });
const FieldValue = {
  serverTimestamp: () => stamp(now),
  increment: amount => ({ kind: 'increment', amount }),
};

function fixture(id, overrides = {}) {
  return {
    id,
    createdAt: stamp(now - DAY),
    expiresAt: stamp(now + DAY),
    locale: 'he',
    result: { overallScore: 65 },
    delivery: {
      status: 'failed', attempts: 0, email: 'lead@example.com',
      storeUrl: 'https://example.com',
      ...overrides,
    },
  };
}
function firestore(records) {
  const rows = new Map(records.map(x => [x.id, x]));
  const queryCalls = [];
  const makeRef = id => ({ id });
  function snapshot(id) {
    const data = rows.get(id);
    return { exists: Boolean(data), id, ref: makeRef(id), data: () => data };
  }
  function apply(id, patch) {
    const doc = rows.get(id);
    for (const [path, value] of Object.entries(patch)) {
      const parts = path.split('.');
      const key = parts.pop();
      let dest = doc;
      for (const part of parts) dest = dest[part] ||= {};
      dest[key] = value?.kind === 'increment' ? (dest[key] || 0) + value.amount : value;
    }
  }
  const query = {
    where: (...a) => { queryCalls.push(['where', ...a]); return query; },
    orderBy: (...a) => { queryCalls.push(['orderBy', ...a]); return query; },
    limit: n => { queryCalls.push(['limit', n]); return query; },
    get: async () => ({ docs: [...rows.keys()]
      .filter(id => ['pending', 'failed', 'retrying'].includes(rows.get(id).delivery.status))
      .map(snapshot) }),
  };
  return {
    rows, queryCalls,
    collection: name => { assert.equal(name, 'store_analysis_reports'); return query; },
    runTransaction: async fn => fn({
      get: async ref => snapshot(ref.id),
      update: (ref, patch) => apply(ref.id, patch),
    }),
  };
}
function options(db, fetchImpl) {
  return { db, FieldValue, now, deliveryKey: 'secret', deliveryUrl: 'https://api.example.com/send',
    fetchImpl, logger: { warn() {}, error() {} } };
}

test('claims an eligible job and sends a stable delivery ID exactly once', async () => {
  const db = firestore([fixture('report-1')]);
  const delivered = [];
  const result = await retryAnalysisReports(options(db, async (url, req) => {
    delivered.push({ url, req });
    return { ok: true };
  }));
  assert.deepEqual(result, { sent: 1, failed: 0, exhausted: 0 });
  assert.equal(delivered.length, 1);
  assert.equal(JSON.parse(delivered[0].req.body).deliveryId, 'report-1');
  assert.equal(JSON.parse(delivered[0].req.body).locale, 'he');
  assert.equal(db.rows.get('report-1').delivery.status, 'sent');
  assert.equal(db.rows.get('report-1').delivery.attempts, 1);
  assert.deepEqual(db.queryCalls.slice(0, 3), [
    ['where', 'delivery.status', 'in', ['pending', 'failed', 'retrying']],
    ['orderBy', 'createdAt', 'asc'], ['limit', 60],
  ]);
  await retryAnalysisReports(options(db, async () => { throw Error('duplicate'); }));
});

test('does not retry a fresh pending report or an already claimed item', async () => {
  const db = firestore([fixture('new-one', { status: 'pending' }),
    fixture('recent-one', { status: 'retrying', lastAttemptAt: stamp(now - 1000) })]);
  db.rows.get('new-one').createdAt = stamp(now - 1000);
  const result = await retryAnalysisReports(options(db, async () => { throw Error('unexpected'); }));
  assert.deepEqual(result, { sent: 0, failed: 0, exhausted: 0 });
});

test('permanent failure transitions to exhausted and does not clog later runs', async () => {
  const db = firestore([fixture('exhausted', { attempts: 4 })]);
  const result = await retryAnalysisReports(options(db, async () => ({ ok: false, status: 503 })));
  assert.equal(result.exhausted, 1);
  assert.equal(db.rows.get('exhausted').delivery.status, 'exhausted');
  assert.equal(db.rows.get('exhausted').delivery.attempts, 5);
  const again = await retryAnalysisReports(options(db, async () => { throw Error('unexpected'); }));
  assert.deepEqual(again, { sent: 0, failed: 0, exhausted: 0 });
});

test('retires legacy exhausted jobs without sending them', async () => {
  const db = firestore([fixture('legacy', { attempts: 5 })]);
  const result = await retryAnalysisReports(options(db, async () => { throw Error('unexpected'); }));
  assert.equal(result.exhausted, 1);
  assert.equal(db.rows.get('legacy').delivery.status, 'exhausted');
});

test('bounds concurrency and only claims nine jobs per run', async () => {
  const db = firestore(Array.from({ length: 13 }, (_, i) => fixture('report-' + i)));
  let active = 0;
  let peak = 0;
  let total = 0;
  const fetchImpl = async () => {
    total++; active++;
    peak = Math.max(peak, active);
    await new Promise(resolve => setImmediate(resolve));
    active--;
    return { ok: true };
  };
  const result = await retryAnalysisReports(options(db, fetchImpl));
  assert.equal(total, 9);
  assert.equal(result.sent, 9);
  assert.ok(peak <= 3);
  assert.ok(peak > 1);
  assert.equal([...db.rows.values()].filter(x => x.delivery.status === 'failed').length, 4);
});
