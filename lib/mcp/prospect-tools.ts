import 'server-only';
import { addProspectActivity } from '@/lib/services/prospect-activities-server';

import type { TokenGrant } from '@/lib/mcp/connection';
import { may } from '@/lib/mcp/connection';
import { scanProspect } from '@/lib/services/prospect-scan-service';
import { updateProspectSales, linkProspectProposal } from '@/lib/services/prospect-sales-server';
import {
  addProspectFinding, addProspectContactCandidate, getProspect, listProspects, upsertProspect, importProspectBatch,
} from '@/lib/services/prospects-server';

const identity = { type: 'string', pattern: '^prospect_[a-f0-9]{32}$' };
const definition = (name: string, description: string, scope: 'prospects:read' | 'prospects:write' | 'prospects:scan',
  properties: Record<string, unknown>, required: string[] = []) => ({
  name, description, scope,
  inputSchema: { type: 'object', properties, required, additionalProperties: false },
});

export const PROSPECT_TOOL_DEFS = [
  definition('list_prospects',
    'List private CartShift researched prospects. Does not expose inbound marketing leads or trigger outreach.',
    'prospects:read',
    { query: { type: 'string', maxLength: 150 },
      limit: { type: 'integer', minimum: 1, maximum: 100 },
      cursor: identity,
      segment: { type: 'string', enum: ['merchant', 'agency_partner', 'unknown'] },
      priority: { type: 'string', enum: ['high', 'normal', 'low'] },
      active_only: { type: 'boolean' },
      owner_uid: { type: 'string' },
      verified_only: { type: 'boolean' },
      due_before: { type: 'string', format: 'date' },
      review_requested: { type: 'boolean' } }),
  definition('get_prospect',
    'Read one researched prospect and source-backed UNVERIFIED findings. Do not present findings as confirmed.',
    'prospects:read', { prospect_id: identity }, ['prospect_id']),
  definition('upsert_prospect',
    'Create or deduplicate a researched candidate business store in CartShift. Requires a public source URL. Never sends a message, creates a client or marks consent approved.',
    'prospects:write',
    { store_url: { type: 'string', minLength: 4, maxLength: 512 },
      brand_name: { type: 'string', maxLength: 180 },
      source_url: { type: 'string', maxLength: 1024 },
      source_type: { type: 'string', enum: ['manual', 'chatgpt_research', 'spreadsheet_import'] },
      research_note: { type: 'string', maxLength: 1000 } }, ['store_url', 'source_url']),
  definition('upsert_prospect_batch',
    'Preview (dry_run=true) or import up to 20 researched business stores. Validates and deduplicates domains, saves only private review-required prospects, no outreach or client invites.',
    'prospects:write', {
      dry_run: { type: 'boolean' },
      prospects: { type: 'array', minItems: 1, maxItems: 20,
        items: { type: 'object',
          required: ['store_url', 'source_url'],
          properties: {
            store_url: { type: 'string' }, brand_name: { type: 'string' },
            source_url: { type: 'string' },
            source_type: { type: 'string', enum: ['manual', 'chatgpt_research', 'spreadsheet_import'] },
            research_note: { type: 'string' },
          },
          additionalProperties: false },
      },
    }, ['prospects']),
  definition('add_prospect_finding',
    'Save a factual research observation about an existing store, with same-domain public evidence URL and excerpt. Always stores UNVERIFIED and does not contact the business.',
    'prospects:write',
    { prospect_id: identity,
      category: { type: 'string', enum: ['ux', 'rtl', 'seo', 'accessibility', 'performance', 'content', 'operations', 'other'] },
      title: { type: 'string', minLength: 6, maxLength: 160 },
      observed_url: { type: 'string', maxLength: 1024 },
      evidence_excerpt: { type: 'string', minLength: 12, maxLength: 800 },
      business_relevance: { type: 'string', maxLength: 500 } },
    ['prospect_id', 'category', 'title', 'observed_url', 'evidence_excerpt']),
  definition('add_prospect_contact_candidate',
    'Record a public business-role contact suggestion from the official store site. Not validated for marketing permission; do not infer email addresses or send outreach.',
    'prospects:write',
    { prospect_id: identity, role: { type: 'string', minLength: 2, maxLength: 120 },
      name: { type: 'string', maxLength: 120 },
      business_email: { type: 'string', maxLength: 240 },
      source_url: { type: 'string', maxLength: 1024 },
      evidence_excerpt: { type: 'string', minLength: 8, maxLength: 400 } },
    ['prospect_id', 'role', 'source_url', 'evidence_excerpt']),
  definition('update_prospect_sales',
    'Update an existing prospect sales stage, assigned CartShift agency user and next action. Stage gates forbid contacting before channel review or proposing before founder technical approval. Does not send outreach.',
    'prospects:write', {
      prospect_id: identity,
      stage: { type: 'string', enum: ['needs_review', 'qualified', 'contact_research',
        'contact_ready', 'in_conversation', 'proposal', 'won', 'lost'] },
      owner_uid: { type: 'string' }, next_action: { type: 'string', maxLength: 500 },
      due_date: { type: 'string', description: 'ISO date, or empty string to clear a follow-up' },
      segment: { type: 'string', enum: ['merchant', 'agency_partner', 'unknown'] },
      priority: { type: 'string', enum: ['high', 'normal', 'low'] },
      archived: { type: 'boolean' },
      note: { type: 'string', maxLength: 2000 },
    }, ['prospect_id']),
  definition('link_prospect_proposal',
    'Link an existing CartShift commercial request (QUOTED, ACCEPTED or PAID) to a technically reviewed researched prospect. Requires verified org and request IDs and a relationship note. Does not create proposals or collect payments.',
    'prospects:write', {
      prospect_id: identity, org_id: { type: 'string' },
      request_id: { type: 'string' }, note: { type: 'string' },
    }, ['prospect_id', 'org_id', 'request_id', 'note']),
  definition('log_prospect_activity',
    'Log a private research note, human call/email/meeting, follow-up, or request a founder deep review. Records history only; NEVER sends a message or grants outreach permission.',
    'prospects:write', {
      prospect_id: identity,
      kind: { type: 'string', enum: ['note', 'call', 'email', 'meeting', 'social', 'follow_up', 'review_request', 'review_completed'] },
      direction: { type: 'string', enum: ['internal', 'inbound', 'outbound'] },
      outcome: { type: 'string', enum: ['none', 'attempted', 'responded', 'positive', 'negative', 'booked'] },
      note: { type: 'string', minLength: 3, maxLength: 1500 },
      occurred_at: { type: 'string', format: 'date-time' },
    }, ['prospect_id', 'kind', 'note']),
  definition('scan_prospect',
    'Run a bounded HTTPS/robots-respecting audit of ONE existing business prospect, save UNVERIFIED findings and public generic business contact candidates. No marketing outreach. Max 6 pages; per-domain cooldown.',
    'prospects:scan', { prospect_id: identity }, ['prospect_id']),
] as const;

export async function callProspectTool(name: string, args: unknown, grant: TokenGrant) {
  const tool = PROSPECT_TOOL_DEFS.find(item => item.name === name);
  if (!tool) throw new Error('Unknown prospect tool');
  may(grant, tool.scope);
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throw new Error('Arguments must be an object');
  }
  if (name === 'list_prospects') return listProspects(args, grant.uid);
  if (name === 'get_prospect') {
    const input = args as Record<string, unknown>;
    if (typeof input.prospect_id !== 'string' || Object.keys(input).length !== 1) {
      throw new Error('Invalid prospect ID arguments');
    }
    return getProspect(input.prospect_id, grant.uid);
  }
  if (name === 'update_prospect_sales') {
    const input = args as Record<string, unknown>;
    if (typeof input.prospect_id !== 'string') throw new Error('Invalid prospect sales arguments');
    const { prospect_id, ...patch } = input;
    return updateProspectSales(prospect_id, patch, grant.uid);
  }
  if (name === 'link_prospect_proposal') {
    const input = args as Record<string, unknown>;
    if (typeof input.prospect_id !== 'string' || typeof input.org_id !== 'string' ||
        typeof input.request_id !== 'string' || typeof input.note !== 'string' ||
        Object.keys(input).length !== 4) {
      throw new Error('Invalid proposal linking arguments');
    }
    return linkProspectProposal(input.prospect_id, input.org_id, input.request_id,
      input.note, grant.uid);
  }
  if (name === 'log_prospect_activity') {
    const input = args as Record<string, unknown>;
    if (typeof input.prospect_id !== 'string') throw new Error('Missing prospect ID');
    const { prospect_id, ...entry } = input;
    return addProspectActivity(prospect_id, entry, grant.uid);
  }
  if (name === 'scan_prospect') {
    const input = args as Record<string, unknown>;
    if (typeof input.prospect_id !== 'string' || Object.keys(input).length !== 1) {
      throw new Error('Invalid prospect scan arguments');
    }
    return scanProspect(input.prospect_id, grant.uid);
  }
  if (name === 'upsert_prospect') return upsertProspect(args, grant.uid);
  if (name === 'upsert_prospect_batch') {
    const input = args as Record<string, unknown>;
    if (!Array.isArray(input.prospects) || Object.keys(input).some(k => !['prospects', 'dry_run'].includes(k)) ||
        (input.dry_run !== undefined && typeof input.dry_run !== 'boolean')) {
      throw new Error('Invalid prospect import arguments');
    }
    return importProspectBatch(input.prospects, grant.uid, input.dry_run === true);
  }
  if (name === 'add_prospect_finding') return addProspectFinding(args, grant.uid);
  if (name === 'add_prospect_contact_candidate') return addProspectContactCandidate(args, grant.uid);
  throw new Error('Unknown prospect tool');
}
