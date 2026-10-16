'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const calls = [];
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'resend') return { Resend: class {
    constructor() { this.emails = { send: async (payload, options) => {
      calls.push({ payload, options });
      return { data: { id: 'mock-provider-id' }, error: null };
    } }; }
  } };
  if (request === '@react-email/render') return { render: async () => '<p>Test notification</p>' };
  return originalLoad.call(this, request, parent, isMain);
};
let sendEmail;
try { ({ sendEmail } = require('../lib/emails/email-service')); }
finally { Module._load = originalLoad; }

test('passes the durable provider idempotency key as Resend request options', async () => {
  const options = { to: 'agency@example.test', subject: 'Contact request',
    templateName: 'contact_form_notification', data: { name: 'Test', email: 'test@example.test', locale: 'en', message: 'Test' }, uniqueId: 'queue-job-42' };
  await sendEmail('test-key', options);
  await sendEmail('test-key', options);
  assert.equal(calls.length, 2);
  assert.ok(calls[0].options?.idempotencyKey);
  assert.equal(calls[0].options.idempotencyKey, calls[1].options.idempotencyKey);
  assert.equal(calls[0].options.idempotencyKey, calls[0].payload.headers['X-Entity-Ref-ID']);
});

test('explicit idempotency keys reach the provider unchanged', async () => {
  await sendEmail('test-key', { to: 'agency@example.test', subject: 'Contact request',
    templateName: 'contact_form_notification', data: { name: 'Test', email: 'test@example.test', locale: 'en', message: 'Test' }, idempotencyKey: 'explicit-delivery-1' });
  assert.equal(calls.at(-1).options?.idempotencyKey, 'explicit-delivery-1');
});
