import 'server-only';

import type { TokenGrant } from '@/lib/mcp/connection';
import { may } from '@/lib/mcp/connection';
import {
  addProspectFinding, addProspectContactCandidate, getProspect, listProspects, upsertProspect,
} from '@/lib/services/prospects-server';

const identity = { type: 'string', pattern: '^prospect_[a-f0-9]{32}$' };
const definition = (name: string, description: string, scope: 'prospects:read' | 'prospects:write',
  properties: Record<string, unknown>, required: string[] = []) => ({
  name, description, scope,
  inputSchema: { type: 'object', properties, required, additionalProperties: false },
});

export const PROSPECT_TOOL_DEFS = [
  definition('list_prospects',
    'List private CartShift researched prospects. Does not expose inbound marketing leads or trigger outreach.',
    'prospects:read',
    { query: { type: 'string', maxLength: 150 }, limit: { type: 'integer', minimum: 1, maximum: 100 } }),
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
  if (name === 'upsert_prospect') return upsertProspect(args, grant.uid);
  if (name === 'add_prospect_finding') return addProspectFinding(args, grant.uid);
  if (name === 'add_prospect_contact_candidate') return addProspectContactCandidate(args, grant.uid);
  throw new Error('Unknown prospect tool');
}
