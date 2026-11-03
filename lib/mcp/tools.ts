import 'server-only';
import { z } from 'zod';
import { FieldPath, FieldValue } from 'firebase-admin/firestore';
import { AUDIT, TokenGrant, firestore, may, tokenHash } from '@/lib/mcp/connection';
import { EXTENDED_TOOL_DEFS, callExtendedTool } from '@/lib/mcp/extended-tools';
import { COMMERCIAL_TOOL_DEFS, callCommercialTool } from '@/lib/mcp/commercial-tools';
import { PROSPECT_TOOL_DEFS, callProspectTool } from '@/lib/mcp/prospect-tools';
import { startSandboxSession, readSandboxSession, sendSandboxSessionInput, stopSandboxSession } from '@/lib/mcp/sandbox-sessions';
import { sandboxPing } from '@/lib/mcp/sandbox-probe';
import { persistClientWorkMode, persistProjectWorkMode } from '@/lib/services/agency-work-modes-server';
import { normalizeWorkMode } from '@/lib/domain/work-engagement';
import { submitSandboxCommand, submitSandboxArtifactRead, getSandboxCommand, getSandboxStatus, getSandboxRecentJobs, cancelSandboxCommand } from '@/lib/mcp/sandbox-jobs';

const id = z.string().min(6).max(128).regex(/^[\w-]+$/);
const text = z.string().trim().min(1).max(4000);
const tinyText = z.string().trim().min(1).max(240);
const enumPriority = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);
const enumType = z.enum(['feature', 'bug', 'optimization', 'content', 'design', 'other']);
// MCP work-item updates cannot impersonate client quote acceptance, alter payment state,
// or bypass the protected commercial workflow.
const enumStatus = z.enum([
  'NEW', 'NEEDS_INFO', 'QUEUED', 'IN_PROGRESS', 'IN_REVIEW', 'DELIVERED', 'CLOSED',
]);
const tags = z.array(z.string().trim().min(1).max(50)).max(12);
const clientFields = z.object({
  name: tinyText.optional(),
  website: z.string().url().max(512).optional(),
  industry: tinyText.optional(),
  bio: text.optional(),
  shopifyDomain: z.string().trim().regex(/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/).optional(),
  primaryContactName: tinyText.optional(),
  primaryContactRole: tinyText.optional(),
  primaryContactEmail: z.string().email().max(240).optional(),
  primaryContactPhone: z.string().trim().max(50).optional(),
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
    name: 'sandbox_start_session', description: 'Start one owner-only persistent CLI login session. Requires a fresh auth-worker handshake; only fixed provider login commands run.', scope: 'work:write',
    inputSchema: { type: 'object', required: ['provider'], properties: { provider: { type: 'string', enum: ['supabase', 'github', 'vercel', 'firebase', 'shopify', 'northflank', 'apps-script'] }, cwd: { type: 'string', default: '/workspace' }, ttl_seconds: { type: 'integer', minimum: 60, maximum: 900, default: 600 }, idle_timeout_seconds: { type: 'integer', minimum: 30, maximum: 300, default: 180 } }, additionalProperties: false },
  },
  {
    name: 'sandbox_read_session', description: 'Read redacted login output since a code-point cursor. Reports output gaps; reads do not extend the idle timeout.', scope: 'work:read',
    inputSchema: { type: 'object', required: ['session_id'], properties: { session_id: { type: 'string', format: 'uuid' }, cursor: { type: 'integer', minimum: 0, default: 0 } }, additionalProperties: false },
  },
  {
    name: 'sandbox_send_input', description: 'Send a bounded confirmation or provider verification code to an owned login session. Never accepts passwords or access tokens. Input is omitted from results and audit.', scope: 'work:write',
    inputSchema: { type: 'object', required: ['session_id', 'input_type', 'input'], properties: { session_id: { type: 'string', format: 'uuid' }, input_type: { type: 'string', enum: ['confirm', 'verification_code'] }, input: { type: 'string', maxLength: 512 } }, additionalProperties: false },
  },
  {
    name: 'sandbox_stop_session', description: 'Stop an owned provider login session and erase pending input.', scope: 'work:write',
    inputSchema: { type: 'object', required: ['session_id'], properties: { session_id: { type: 'string', format: 'uuid' } }, additionalProperties: false },
  },

  {
    name: 'sandbox_run_command',
    description: 'Queue a command in the owner-only Linux ARM64 Docker sandbox. Returns a job ID, or waits up to 15 seconds for quick commands when wait_seconds is set. Commands run only in the separate Docker worker. Local open-source Desktop Commander is available through node /workspace/scripts/sandbox_desktop_commander.mjs list, or its request command with JSON stdin {"op":"call","tool":"NAME","args":{}}. Use a quoted heredoc for JSON. Sessions persist in that local engine across jobs. No hosted Desktop Commander account or Codex Remote is needed. Timeouts above 120s require an active V2+ worker; running cancellation and artifacts require V4.',
    scope: 'work:write',
    inputSchema: { type: 'object', required: ['command'], properties: {
      command: { type: 'string', minLength: 1, maxLength: 2000 },
      cwd: { type: 'string', description: 'Working directory inside /workspace (default /workspace). Independent task directories need no Git repository; overlapping task directories are serialized in V5.' },
      exclusive_workspace: { type: 'boolean', default: false, description: 'V5: reserve the whole workspace for cross-task/shared tool modifications. Default-cwd commands run concurrently; scope writes with cwd or request this reservation.' },
      timeout_seconds: { type: 'integer', minimum: 1, maximum: 600 },
      wait_seconds: { type: 'integer', minimum: 0, maximum: 15, description: 'Optional short wait for completed output; 0 queues without waiting.' },
    }, additionalProperties: false },
  },
  {
    name: 'sandbox_read_artifact',
    description: 'Queue a bounded binary-safe read of a file under /workspace/artifacts. Retrieve base64 and SHA-256 chunk metadata with sandbox_get_result; no arbitrary filesystem reads.',
    scope: 'work:read',
    inputSchema: { type: 'object', required: ['path'], properties: {
      path: { type: 'string', description: 'Relative path under /workspace/artifacts' },
      offset: { type: 'integer', minimum: 0, default: 0 },
      length: { type: 'integer', minimum: 1, maximum: 12000, default: 12000 },
      wait_seconds: { type: 'integer', minimum: 0, maximum: 15, default: 0 },
    }, additionalProperties: false },
  },
  {
    name: 'sandbox_get_result',
    description: 'Read the status, stdout, stderr and exit code of a sandbox command job belonging to the specifically authorized sandbox owner.',
    scope: 'work:read',
    inputSchema: { type: 'object', required: ['job_id'],
      properties: { job_id: { type: 'string' } }, additionalProperties: false },
  },
  {
    name: 'sandbox_recent_jobs', description: 'List up to 30 recent owner-only sandbox jobs with statuses and timings, never command text or output.', scope: 'work:read',
    inputSchema: { type: 'object', properties: { limit: { type: 'integer', minimum: 1, maximum: 30, default: 15 } }, additionalProperties: false },
  },
  {
    name: 'sandbox_status',
    description: 'Check actual sandbox worker heartbeat, capabilities and last seen timestamp. Unlike sandbox_ping this reflects the authenticated Docker worker.',
    scope: 'work:read',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'sandbox_cancel_command',
    description: 'Cancel a queued job immediately or request cooperative cancellation of a running V4 worker job. Check the result for confirmation.',
    scope: 'work:write',
    inputSchema: { type: 'object', required: ['job_id'],
      properties: { job_id: { type: 'string' } }, additionalProperties: false },
  },
  {
    name: 'sandbox_ping',
    description: 'Check whether the separate AI Docker Mobile Probe cloud endpoint is reachable from CartShift MCP. Read-only connectivity experiment; does not access Docker, terminals or files.',
    scope: 'clients:read',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'list_clients', description: 'List authorized agency client organizations. Search by name, website or Shopify domain.',
    scope: 'clients:read',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } }, additionalProperties: false },
  },
  {
    name: 'create_client', description: 'Create a new agency client organization without invitations or membership grants. Search first; duplicate names, websites and Shopify domains are rejected.',
    scope: 'clients:write',
    inputSchema: {
      type: 'object', required: ['name'],
      properties: {
        name: { type: 'string' }, website: { type: 'string' },
        industry: { type: 'string' }, bio: { type: 'string' },
        shopifyDomain: { type: 'string' },
        primaryContactName: { type: 'string' }, primaryContactRole: { type: 'string' },
        primaryContactEmail: { type: 'string' }, primaryContactPhone: { type: 'string' },
      }, additionalProperties: false,
    },
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
          bio: { type: 'string' }, shopifyDomain: { type: 'string' },
          primaryContactName: { type: 'string' }, primaryContactRole: { type: 'string' },
          primaryContactEmail: { type: 'string' }, primaryContactPhone: { type: 'string' },
          billingName: { type: 'string' },
          billingEmail: { type: 'string' }, billingTaxId: { type: 'string' },
          billingAddressLine1: { type: 'string' }, billingAddressLine2: { type: 'string' },
          billingCity: { type: 'string' }, billingCountry: { type: 'string' },
          billingPostalCode: { type: 'string' },
        }, additionalProperties: false },
      }, additionalProperties: false,
    },
  },

  {
    name: 'get_client_work_mode',
    description: 'Read the agency-only default work classification of one client. Relationship memo is returned only to owner/admin.',
    scope: 'clients:read',
    inputSchema: { type: 'object', required: ['org_id'], properties: {
      org_id: { type: 'string' },
    }, additionalProperties: false },
  },
  {
    name: 'set_client_work_mode',
    description: 'Owner/admin only: set the agency-private default commercial/pro-bono work mode. Does NOT change existing projects, payments or customer-facing biography.',
    scope: 'clients:write',
    inputSchema: { type: 'object', required: ['org_id', 'work_mode'], properties: {
      org_id: { type: 'string' },
      work_mode: { type: 'string', enum: ['commercial', 'pro_bono'] },
      internal_relationship_note: { type: 'string', maxLength: 1500 },
    }, additionalProperties: false },
  },
  {
    name: 'set_project_work_mode',
    description: 'Owner/admin only: explicitly classify an existing project, rejecting commercial records and non-zero rate on Pro Bono. Never changes payment ledger or work-item statuses.',
    scope: 'work:write',
    inputSchema: { type: 'object', required: ['org_id', 'project_id', 'work_mode'], properties: {
      org_id: { type: 'string' },
      project_id: { type: 'string' },
      work_mode: { type: 'string', enum: ['commercial', 'pro_bono'] },
    }, additionalProperties: false },
  },
  {
    name: 'list_work_items', description: 'Page through portal_requests for exactly one client organization. Use next_cursor to continue.',
    scope: 'work:read',
    inputSchema: { type: 'object', properties: {
      org_id: { type: 'string' },
      page_size: { type: 'integer', minimum: 1, maximum: 200 },
      cursor: { type: 'string', minLength: 6, maxLength: 128 },
    }, required: ['org_id'], additionalProperties: false },
  },
  {
    name: 'get_work_item', description: 'Get a work item, verifying its organization matches.',
    scope: 'work:read',
    inputSchema: { type: 'object', required: ['org_id', 'work_item_id'], properties: {
      org_id: { type: 'string' }, work_item_id: { type: 'string' },
    }, additionalProperties: false },
  },
  {
    name: 'create_work_item', description: 'Create an agency work item only when no semantically matching item already exists. For Israeli / Hebrew-speaking clients, write the TITLE and DESCRIPTION in clear natural Hebrew (retain technical brand/product names like Shopify, Make, SKU); do not default to English. Does not create a bill or invite.',
    scope: 'work:write',
    inputSchema: { type: 'object', required: ['org_id', 'title', 'description', 'type', 'priority'], properties: {
      org_id: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' },
      type: { type: 'string', enum: ['feature', 'bug', 'optimization', 'content', 'design', 'other'] },
      priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
      tags: { type: 'array', items: { type: 'string' } },
    }, additionalProperties: false },
  },
  {
    name: 'update_work_item', description: 'Update existing portal request after checking its actual status. For Israeli / Hebrew-speaking clients, keep title and description in clear natural Hebrew, including when revising older English tasks. Does not alter payments, prices, or organization.',
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
  ...EXTENDED_TOOL_DEFS,
  ...PROSPECT_TOOL_DEFS,
  ...COMMERCIAL_TOOL_DEFS,
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
  if (name === 'sandbox_start_session') return startSandboxSession(grant, args);
  if (name === 'sandbox_read_session') return readSandboxSession(grant, args);
  if (name === 'sandbox_send_input') return sendSandboxSessionInput(grant, args);
  if (name === 'sandbox_stop_session') return stopSandboxSession(grant, args);
  if (name === 'sandbox_run_command') return submitSandboxCommand(grant, args);
  if (name === 'sandbox_read_artifact') return submitSandboxArtifactRead(grant, args);
  if (name === 'sandbox_get_result') return getSandboxCommand(grant, args);
  if (name === 'sandbox_recent_jobs') return getSandboxRecentJobs(grant, args);
  if (name === 'sandbox_status') { z.object({}).strict().parse(args); return getSandboxStatus(grant); }
  if (name === 'sandbox_cancel_command') return cancelSandboxCommand(grant, args);
  if (name === 'sandbox_ping') {
    z.object({}).strict().parse(args);
    return sandboxPing();
  }
  if (EXTENDED_TOOL_DEFS.some(item => item.name === name)) {
    return callExtendedTool(name, args, grant);
  }
  if (COMMERCIAL_TOOL_DEFS.some(item => item.name === name)) {
    return callCommercialTool(name, args, grant);
  }
  if (PROSPECT_TOOL_DEFS.some(item => item.name === name)) {
    return callProspectTool(name, args, grant);
  }
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


  if (name === 'create_client') {
    const fields = clientFields.pick({
      name: true, website: true, industry: true, bio: true, shopifyDomain: true,
      primaryContactName: true, primaryContactRole: true,
      primaryContactEmail: true, primaryContactPhone: true,
    }).extend({ name: tinyText });
    const data = fields.parse(args);
    const normalizeDomain = (value: string) => value.toLowerCase().replace(/^https?:\/\//, '')
      .replace(/^www\./, '').replace(/\/+$/, '');
    const expectedWebsite = data.website ? normalizeDomain(data.website) : '';
    const expectedShopify = data.shopifyDomain?.toLowerCase() || '';
    const matches = await orgs.orderBy('name').limit(500).get();
    if (matches.size === 500) throw new Error('Client list is too large to safely deduplicate');
    const duplicate = matches.docs.find(doc => {
      const current = doc.data();
      if (current.removedAt || current.status === 'inactive') return false;
      return normalize(String(current.name || '')) === normalize(data.name) ||
        Boolean(expectedWebsite && normalizeDomain(String(current.website || '')) === expectedWebsite) ||
        Boolean(expectedShopify && String(current.shopifyDomain || '').toLowerCase() === expectedShopify);
    });
    if (duplicate) return { created: false, duplicate: true, org_id: duplicate.id, name: duplicate.data().name };
    const key = expectedShopify || expectedWebsite || normalize(data.name);
    const ref = orgs.doc('mcp_client_' + tokenHash(key).slice(0, 32));
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      'client-' + tokenHash(data.name).slice(0, 10);
    let created = false;
    await db.runTransaction(async tx => {
      const prior = await tx.get(ref);
      if (prior.exists) return;
      tx.create(ref, {
        ...data, slug, status: 'active', createdBy: grant.uid,
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      tx.create(audits.doc(), auditRow(grant.uid, 'create_client', ref.id));
      created = true;
    });
    return { created, duplicate: !created, org_id: ref.id, name: data.name, invitations_sent: false };
  }

  if (name === 'get_client') {
    const { org_id } = z.object({ org_id: id }).strict().parse(args);
    const doc = await orgExists(org_id);
    const data = doc.data() || {};
    const allowed = ['name', 'slug', 'website', 'industry', 'bio', 'shopifyDomain', 'shopifyAccessStatus',
      'responsibleAgencyUserId', 'primaryContactName', 'primaryContactRole',
      'primaryContactEmail', 'primaryContactPhone', 'billingName', 'billingEmail', 'billingTaxId',
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


  if (name === 'get_client_work_mode') {
    const { org_id } = z.object({ org_id: id }).strict().parse(args);
    await orgExists(org_id);
    const [meta, actor] = await Promise.all([
      db.collection('agency_client_metadata').doc(org_id).get(),
      db.collection('portal_users').doc(grant.uid).get(),
    ]);
    const role = actor.data()?.agencyRole ?? 'owner';
    return {
      org_id,
      work_mode: normalizeWorkMode(meta.data()?.defaultWorkMode),
      ...(role === 'owner' || role === 'admin' ? {
        internal_relationship_note: meta.data()?.internalRelationshipNote ?? '',
      } : {}),
    };
  }

  if (name === 'set_client_work_mode' || name === 'set_project_work_mode') {
    const actor = await db.collection('portal_users').doc(grant.uid).get();
    if (!['owner', 'admin'].includes(actor.data()?.agencyRole ?? 'owner')) {
      throw new Error('FORBIDDEN');
    }
    if (name === 'set_client_work_mode') {
      const input = z.object({
        org_id: id,
        work_mode: z.enum(['commercial', 'pro_bono']),
        internal_relationship_note: z.string().max(1500).optional(),
      }).strict().parse(args);
      await orgExists(input.org_id);
      return persistClientWorkMode(grant.uid, {
        orgId: input.org_id,
        defaultWorkMode: input.work_mode,
        ...(input.internal_relationship_note !== undefined
          ? { internalRelationshipNote: input.internal_relationship_note } : {}),
      });
    }
    const input = z.object({
      org_id: id, project_id: id,
      work_mode: z.enum(['commercial', 'pro_bono']),
    }).strict().parse(args);
    await orgExists(input.org_id);
    return persistProjectWorkMode(grant.uid, {
      orgId: input.org_id, projectId: input.project_id,
      workMode: input.work_mode,
    });
  }

  if (name === 'list_work_items') {
    const { org_id, page_size = 100, cursor } = z.object({
      org_id: id,
      page_size: z.number().int().min(1).max(200).optional(),
      cursor: id.optional(),
    }).strict().parse(args);
    await orgExists(org_id);
    // Sorting by document ID gives stable, resumable pages. The extra document
    // establishes whether another page exists, without fetching an entire tenant.
    let pageQuery = requests
      .where('orgId', '==', org_id)
      .orderBy(FieldPath.documentId())
      .limit(page_size + 1);
    if (cursor) pageQuery = pageQuery.startAfter(cursor);
    const snap = await pageQuery.get();
    const page = snap.docs.slice(0, page_size);
    const truncated = snap.docs.length > page_size;
    return {
      items: page.map(doc => ({
        id: doc.id, title: doc.data().title, description: doc.data().description,
        status: doc.data().status, type: doc.data().type, priority: doc.data().priority,
        tags: doc.data().tags || [], projectId: doc.data().projectId || null,
        isCommercial: Boolean(doc.data().isBillable || doc.data().publicToken || doc.data().requestRole === 'bundle'),
      })),
      truncated,
      next_cursor: truncated ? page[page.length - 1]?.id ?? null : null,
    };
  }

  if (name === 'get_work_item') {
    const { org_id, work_item_id } = z.object({ org_id: id, work_item_id: id }).strict().parse(args);
    await orgExists(org_id);
    const doc = await requests.doc(work_item_id).get();
    if (!doc.exists || doc.data()?.orgId !== org_id) throw new Error('Work item not found for this client');
    const data = doc.data() || {};
    return { id: doc.id, orgId: data.orgId, title: data.title, description: data.description,
      type: data.type, status: data.status, priority: data.priority, tags: data.tags,
      projectId: data.projectId || null,
      isCommercial: Boolean(data.isBillable || data.publicToken || data.requestRole === 'bundle'),
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
      const current = doc.data() || {};
      if (current.isBillable || current.publicToken || current.lockedAt ||
        current.requestRole === 'bundle' || current.parentRequestId) {
        throw new Error('Commercial work items must use the proposal workflow');
      }
      tx.update(ref, { ...patch, updatedAt: FieldValue.serverTimestamp() });
      tx.create(audits.doc(), auditRow(grant.uid, 'update_work_item', work_item_id));
    });
    return { updated: true, work_item_id, org_id, fields: Object.keys(patch) };
  }
  throw new Error('Unknown tool');
}
