import 'server-only';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { AUDIT, TokenGrant, firestore, may, tokenHash } from '@/lib/mcp/connection';

const id = z.string().min(6).max(128).regex(/^[\w-]+$/);
const text = z.string().trim().min(1).max(4000);
const tinyText = z.string().trim().min(1).max(240);
const enumPriority = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);
const enumType = z.enum(['feature', 'bug', 'optimization', 'content', 'design', 'other']);
const enumStatus = z.enum([
  'DRAFT', 'NEW', 'NEEDS_INFO', 'QUOTED', 'CHANGES_REQUESTED', 'ACCEPTED',
  'DECLINED', 'QUEUED', 'IN_PROGRESS', 'IN_REVIEW', 'DELIVERED', 'PAID',
  'CLOSED', 'CANCELED', 'EXPIRED',
]);
const tags = z.array(z.string().trim().min(1).max(50)).max(12);
const clientFields = z.object({
  name: tinyText.optional(),
  website: z.string().url().max(512).optional(),
  industry: tinyText.optional(),
  bio: text.optional(),
  shopifyDomain: z.string().trim().regex(/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/).optional(),
  billingName: tinyText.optional(),
  billingEmail: z.string().email().max(240).optional(),
  billingTaxId: z.string().trim().max(80).optional(),
  billingAddressLine1: tinyText.optional(),
  billingAddressLine2: tinyText.optional(),
  billingCity: tinyText.optional(),
  billingCountry: tinyText.optional(),
  billingPostalCode: tinyText.optional(),
}).strict();
const requestFields = z.object({
  title: tinyText.optional(),
  description: text.optional(),
  type: enumType.optional(),
  status: enumStatus.optional(),
  priority: enumPriority.optional(),
  tags: tags.optional(),
}).strict();

export const TOOL_DEFS = [
  {
    name: 'list_clients', description: 'List authorized agency client organizations. Search by name, website or Shopify domain.',
    scope: 'clients:read',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } }, additionalProperties: false },
  },
  {
    name: 'get_client', description: 'Get one CartShift client by canonical organization ID.',
    scope: 'clients:read',
    inputSchema: { type: 'object', properties: { org_id: { type: 'string' } }, required: ['org_id'], additionalProperties: false },
  },
  {
    name: 'update_client', description: 'Update supported profile fields of an EXISTING client. Read the client first; does not change owner, members, access rights or payments.',
    scope: 'clients:write',
    inputSchema: {
      type: 'object', required: ['org_id', 'patch'],
      properties: {
        org_id: { type: 'string' },
        patch: { type: 'object', properties: {
          name: { type: 'string' }, website: { type: 'string' }, industry: { type: 'string' },
          bio: { type: 'string' }, shopifyDomain: { type: 'string' }, billingName: { type: 'string' },
          billingEmail: { type: 'string' }, billingTaxId: { type: 'string' },
          billingAddressLine1: { type: 'string' }, billingAddressLine2: { type: 'string' },
          billingCity: { type: 'string' }, billingCountry: { type: 'string' },
          billingPostalCode: { type: 'string' },
        }, additionalProperties: false },
      }, additionalProperties: false,
    },
  },
  {
    name: 'list_work_items', description: 'List current portal_requests for exactly one client organization.',
    scope: 'work:read',
    inputSchema: { type: 'object', properties: { org_id: { type: 'string' } }, required: ['org_id'], additionalProperties: false },
  },
  {
    name: 'get_work_item', description: 'Get a work item, verifying its organization matches.',
    scope: 'work:read',
    inputSchema: { type: 'object', required: ['org_id', 'work_item_id'], properties: {
      org_id: { type: 'string' }, work_item_id: { type: 'string' },
    }, additionalProperties: false },
  },
  {
    name: 'create_work_item', description: 'Create an agency work item only when no semantically matching item already exists. Does not create a bill or invite.',
    scope: 'work:write',
    inputSchema: { type: 'object', required: ['org_id', 'title', 'description', 'type', 'priority'], properties: {
      org_id: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' },
      type: { type: 'string', enum: ['feature', 'bug', 'optimization', 'content', 'design', 'other'] },
      priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
      tags: { type: 'array', items: { type: 'string' } },
    }, additionalProperties: false },
  },
  {
    name: 'update_work_item', description: 'Update existing portal request after checking its actual status. Does not alter payments, prices, or organization.',
    scope: 'work:write',
    inputSchema: { type: 'object', required: ['org_id', 'work_item_id', 'patch'], properties: {
      org_id: { type: 'string' }, work_item_id: { type: 'string' },
      patch: { type: 'object', properties: {
        title: { type: 'string' }, description: { type: 'string' }, type: { type: 'string' },
        status: { type: 'string' }, priority: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
      }, additionalProperties: false },
    }, additionalProperties: false },
  },
] as const;

function serialize(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}
function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}
async function orgExists(orgId: string) {
  const doc = await firestore().collection('portal_organizations').doc(orgId).get();
  if (!doc.exists || doc.data()?.removedAt || doc.data()?.status === 'inactive') {
    throw new Error('Organization not found or inactive');
  }
  return doc;
}
function auditRow(uid: string, action: string, targetId: string) {
  return { uid, action, targetId, at: Date.now() };
}
function getArgs(args: unknown) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Arguments must be an object');
  return args;
}

export async function callTool(name: string, input: unknown, grant: TokenGrant): Promise<unknown> {
  const tool = TOOL_DEFS.find(t => t.name === name);
  if (!tool) throw new Error('Unknown tool');
  may(grant, tool.scope);
  const args = getArgs(input);
  const db = firestore();
  const orgs = db.collection('portal_organizations');
  const requests = db.collection('portal_requests');
  const audits = db.collection(AUDIT);

  if (name === 'list_clients') {
    const { query = '' } = z.object({ query: z.string().max(200).optional() }).strict().parse(args);
    const matches = await orgs.orderBy('name').limit(500).get();
    const result = matches.docs.filter(doc => !doc.data().removedAt && doc.data().status !== 'inactive')
      .filter(doc => {
        const data = doc.data();
        return [data.name, data.website, data.shopifyDomain].some(v =>
          String(v || '').toLocaleLowerCase().includes(query.toLocaleLowerCase())
        );
      }).map(doc => ({
        id: doc.id, name: doc.data().name, website: doc.data().website || null,
        shopifyDomain: doc.data().shopifyDomain || null, status: doc.data().status || 'active',
      }));
    return { clients: result, truncated: matches.size === 500 };
  }

  if (name === 'get_client') {
    const { org_id } = z.object({ org_id: id }).strict().parse(args);
    const doc = await orgExists(org_id);
    const data = doc.data() || {};
    const allowed = ['name', 'slug', 'website', 'industry', 'bio', 'shopifyDomain', 'shopifyAccessStatus',
      'responsibleAgencyUserId', 'billingName', 'billingEmail', 'billingTaxId',
      'billingAddressLine1', 'billingAddressLine2', 'billingCity', 'billingCountry', 'billingPostalCode', 'updatedAt'];
    return { id: doc.id, ...Object.fromEntries(allowed.filter(k => data[k] !== undefined).map(k => [k, serialize(data[k])])) };
  }

  if (name === 'update_client') {
    const { org_id, patch } = z.object({ org_id: id, patch: clientFields }).strict().parse(args);
    if (!Object.keys(patch).length) throw new Error('Empty client patch');
    const ref = orgs.doc(org_id);
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.removedAt || snap.data()?.status === 'inactive') throw new Error('Client not found');
      tx.update(ref, { ...patch, updatedAt: FieldValue.serverTimestamp() });
      tx.create(audits.doc(), auditRow(grant.uid, 'update_client', org_id));
    });
    return { updated: true, org_id, fields: Object.keys(patch) };
  }

  if (name === 'list_work_items') {
    const { org_id } = z.object({ org_id: id }).strict().parse(args);
    await orgExists(org_id);
    const snap = await requests.where('orgId', '==', org_id).limit(500).get();
    return { items: snap.docs.map(doc => ({
      id: doc.id, title: doc.data().title, description: doc.data().description,
      status: doc.data().status, type: doc.data().type, priority: doc.data().priority,
      tags: doc.data().tags || [],
    })), truncated: snap.size === 500 };
  }

  if (name === 'get_work_item') {
    const { org_id, work_item_id } = z.object({ org_id: id, work_item_id: id }).strict().parse(args);
    await orgExists(org_id);
    const doc = await requests.doc(work_item_id).get();
    if (!doc.exists || doc.data()?.orgId !== org_id) throw new Error('Work item not found for this client');
    const data = doc.data() || {};
    return { id: doc.id, orgId: data.orgId, title: data.title, description: data.description,
      type: data.type, status: data.status, priority: data.priority, tags: data.tags,
      createdAt: serialize(data.createdAt), updatedAt: serialize(data.updatedAt) };
  }

  if (name === 'create_work_item') {
    const { org_id, ...item } = z.object({
      org_id: id, title: tinyText, description: text, type: enumType,
      priority: enumPriority, tags: tags.optional(),
    }).strict().parse(args);
    await orgExists(org_id);
    const siblings = await requests.where('orgId', '==', org_id).limit(500).get();
    if (siblings.size === 500) throw new Error('Too many work items to safely deduplicate; review manually');
    const existing = siblings.docs.find(doc => normalize(doc.data().title || '') === normalize(item.title));
    if (existing) return { created: false, duplicate: true, id: existing.id, status: existing.data().status };
    const stableId = 'mcp_' + tokenHash(org_id + '|' + normalize(item.title)).slice(0, 30);
    const ref = requests.doc(stableId);
    let created = false;
    await db.runTransaction(async tx => {
      const prior = await tx.get(ref);
      if (prior.exists) return;
      tx.create(ref, {
        orgId: org_id, title: item.title, description: item.description, type: item.type,
        status: 'NEW', priority: item.priority, requestRole: 'standalone',
        createdBy: grant.uid, createdByName: grant.uid, tags: item.tags || [],
        attachmentIds: [], commentCount: 0,
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      tx.create(audits.doc(), auditRow(grant.uid, 'create_work_item', stableId));
      created = true;
    });
    return { created, duplicate: !created, id: stableId, status: 'NEW' };
  }

  if (name === 'update_work_item') {
    const { org_id, work_item_id, patch } = z.object({
      org_id: id, work_item_id: id, patch: requestFields,
    }).strict().parse(args);
    if (!Object.keys(patch).length) throw new Error('Empty work-item patch');
    await orgExists(org_id);
    const ref = requests.doc(work_item_id);
    await db.runTransaction(async tx => {
      const doc = await tx.get(ref);
      if (!doc.exists || doc.data()?.orgId !== org_id) throw new Error('Work item not found for this client');
      tx.update(ref, { ...patch, updatedAt: FieldValue.serverTimestamp() });
      tx.create(audits.doc(), auditRow(grant.uid, 'update_work_item', work_item_id));
    });
    return { updated: true, work_item_id, org_id, fields: Object.keys(patch) };
  }
  throw new Error('Unknown tool');
}
