import 'server-only';

import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { AUDIT, type TokenGrant, firestore, may, tokenHash } from '@/lib/mcp/connection';
import { validateProposalCap, validateProposalContent, type ProposalContent } from '@/lib/domain/proposal-content';

const identifier = z.string().min(6).max(128).regex(/^[\w-]+$/);
const short = z.string().trim().min(1).max(240);
const long = z.string().trim().max(6000);
const money = z.number().int().nonnegative().max(1_000_000_000);
const hours = z.number().finite().min(0).max(10000);
const currency = z.enum(['ILS', 'USD', 'EUR']);
const schemaId = { type: 'string', minLength: 6, maxLength: 128 };
const orgProps = { org_id: schemaId };
const projectProps = { ...orgProps, project_id: schemaId };

function def(name: string, description: string, scope: 'work:read' | 'work:write',
  properties: Record<string, unknown>, required: string[]) {
  return { name, description, scope, inputSchema: {
    type: 'object', properties, required, additionalProperties: false,
  } };
}

export const COMMERCIAL_TOOL_DEFS = [
  def('set_project_scope', 'Set a project hourly estimate and rate from an approved/source-backed proposal. Client-visible; does not bill or charge.',
    'work:write', { ...projectProps, min_hours: { type: 'number' }, max_hours: { type: 'number' },
      hourly_rate_minor: { type: 'integer' }, currency: { type: 'string', enum: currency.options } },
    ['org_id', 'project_id', 'min_hours', 'max_hours', 'hourly_rate_minor', 'currency']),
  def('set_project_stage', 'Set the status of an existing project stage after reading and verifying evidence; not a launch/publish action.',
    'work:write', { ...projectProps, stage_id: schemaId, status: {
      type: 'string', enum: ['pending', 'in_progress', 'completed'],
    } }, ['org_id', 'project_id', 'stage_id', 'status']),
  def('set_project_checklist_item', 'Set a current project checklist item, without claiming external Shopify publication or client approval. Never complete client sign-off without evidence.',
    'work:write', { ...projectProps, field: { type: 'string', enum: ['inputs', 'launchChecks'] },
      item_id: schemaId, done: { type: 'boolean' } }, ['org_id', 'project_id', 'field', 'item_id', 'done']),
  def('import_proposal_draft', 'Import an existing external client proposal as a PRIVATE agency draft linked to a client project. Records client-REPORTED deposit separately; DOES NOT mark it paid, invoice, send or obtain client acceptance.',
    'work:write', { ...projectProps, title: { type: 'string' }, objective: { type: 'string' },
      scope_sections: { type: 'array', items: { type: 'object', properties: {
        title: { type: 'string' }, description: { type: 'string' },
        hours_min: { type: 'number' }, hours_max: { type: 'number' },
      }, required: ['title', 'description'], additionalProperties: false } },
      min_hours: { type: 'number' }, max_hours: { type: 'number' },
      hourly_rate_minor: { type: 'integer' }, currency: { type: 'string', enum: currency.options },
      tax_rate: { type: 'number' }, deposit_percent: { type: 'number' },
      terms: { type: 'string' }, agency_notes: { type: 'string' },
      source_url: { type: 'string' }, external_invoice_reference: { type: 'string' },
      reported_deposit_minor: { type: 'integer' }, reported_deposit_date: { type: 'string' },
      client_name: { type: 'string' }, client_email: { type: 'string' },
      deliverables: { type: 'array', items: { type: 'string' } },
      exclusions: { type: 'array', items: { type: 'string' } },
    }, ['org_id', 'project_id', 'title', 'objective', 'scope_sections',
      'min_hours', 'max_hours', 'hourly_rate_minor', 'currency', 'deposit_percent',
      'terms', 'source_url']),
  def('link_proposal_to_project', 'Link an existing private/agency proposal to a project in the SAME client organization. Never alters pricing, acceptance or payment.',
    'work:write', { ...projectProps, proposal_id: schemaId }, ['org_id', 'project_id', 'proposal_id']),
  def('get_proposal_reconciliation', 'Summarize canonical VERIFIED payments, reported but UNVERIFIED deposit, and estimated remaining balance for an agency proposal.',
    'work:read', { ...orgProps, proposal_id: schemaId }, ['org_id', 'proposal_id']),
] as const;

const scopeSchema = z.object({
  org_id: identifier, project_id: identifier,
  min_hours: hours, max_hours: hours, hourly_rate_minor: money.positive(), currency,
}).strict();
const sectionSchema = z.object({
  title: short, description: long,
  hours_min: hours.optional(), hours_max: hours.optional(),
}).strict();
const importSchema = scopeSchema.extend({
  title: short, objective: long.min(1),
  scope_sections: z.array(sectionSchema).min(1).max(25),
  tax_rate: z.number().finite().min(0).max(0.3).default(0),
  deposit_percent: z.number().finite().min(0).max(100),
  terms: long.min(1), agency_notes: long.default(''),
  source_url: z.string().url().max(512),
  external_invoice_reference: z.string().trim().max(240).optional(),
  reported_deposit_minor: money.optional(),
  reported_deposit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  client_name: short.optional(), client_email: z.string().email().optional(),
  deliverables: z.array(short).max(25).default([]),
  exclusions: z.array(short).max(25).default([]),
}).strict();

function normalize(s: string) {
  return s.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}
function audit(uid: string, action: string, targetId: string) {
  return { uid, action, targetId, at: Date.now() };
}
async function validateProject(orgId: string, projectId: string) {
  const db = firestore();
  const [org, project] = await Promise.all([
    db.collection('portal_organizations').doc(orgId).get(),
    db.collection('portal_projects').doc(projectId).get(),
  ]);
  if (!org.exists || org.data()?.removedAt || ['inactive', 'suspended'].includes(org.data()?.status)) {
    throw new Error('Organization not found or inactive');
  }
  if (!project.exists || project.data()?.orgId !== orgId) throw new Error('Project not found for this client');
  return project;
}
async function validateProposal(orgId: string, proposalId: string) {
  const db = firestore();
  const proposal = await db.collection('portal_requests').doc(proposalId).get();
  if (!proposal.exists || proposal.data()?.orgId !== orgId ||
    !(proposal.data()?.isBillable || proposal.data()?.publicToken || proposal.data()?.requestRole === 'bundle')) {
    throw new Error('Proposal not found for this client');
  }
  return proposal;
}
function buildContent(args: z.infer<typeof importSchema>): ProposalContent {
  return {
    schemaVersion: 1, objective: args.objective,
    scope: args.scope_sections.map((s, i) => ({
      id: 'scope-' + (i + 1), title: s.title, description: s.description,
      ...(s.hours_min === undefined ? {} : { hoursMin: s.hours_min }),
      ...(s.hours_max === undefined ? {} : { hoursMax: s.hours_max }),
    })),
    requirements: [], assumptions: [], exclusions: args.exclusions, deliverables: args.deliverables,
    pricing: { mode: 'hourly_capped', hourlyRateMinor: args.hourly_rate_minor,
      hoursMin: args.min_hours, hoursMax: args.max_hours,
      depositPercent: args.deposit_percent },
    paymentTerms: args.terms,
  };
}

export async function callCommercialTool(name: string, raw: unknown, grant: TokenGrant): Promise<unknown> {
  const definition = COMMERCIAL_TOOL_DEFS.find(x => x.name === name);
  if (!definition) throw new Error('Unknown tool');
  may(grant, definition.scope);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Arguments must be an object');
  const db = firestore(), projects = db.collection('portal_projects'),
    requests = db.collection('portal_requests'), audits = db.collection(AUDIT);

  if (name === 'set_project_scope') {
    const input = scopeSchema.parse(raw);
    if (input.max_hours < input.min_hours) throw new Error('Invalid project hours range');
    await validateProject(input.org_id, input.project_id);
    const ref = projects.doc(input.project_id);
    let changed = false;
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.orgId !== input.org_id) throw new Error('Project not found for this client');
      if (snap.data()?.workMode === 'pro_bono' && input.hourly_rate_minor > 0) {
        throw new Error('PRO_BONO_NO_BILLING');
      }
      const scope = { minHours: input.min_hours, maxHours: input.max_hours,
        rateCents: input.hourly_rate_minor, currency: input.currency };
      if (JSON.stringify(snap.data()?.scope) === JSON.stringify(scope)) return;
      tx.update(ref, { scope, updatedAt: FieldValue.serverTimestamp() });
      tx.create(audits.doc(), audit(grant.uid, 'set_project_scope', ref.id));
      changed = true;
    });
    return { updated: changed, project_id: ref.id, scope: {
      minHours: input.min_hours, maxHours: input.max_hours,
      rateCents: input.hourly_rate_minor, currency: input.currency,
    }, client_visible: true };
  }

  if (name === 'set_project_stage') {
    const input = z.object({ org_id: identifier, project_id: identifier,
      stage_id: identifier, status: z.enum(['pending', 'in_progress', 'completed']) }).strict().parse(raw);
    await validateProject(input.org_id, input.project_id);
    const ref = projects.doc(input.project_id);
    let changed = false;
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.orgId !== input.org_id) throw new Error('Project not found for this client');
      const stages = (snap.data()?.stages || []) as Array<{ id: string; title: string; status: string }>;
      if (!stages.some(x => x.id === input.stage_id)) throw new Error('Stage not found');
      if (stages.some(x => x.id === input.stage_id && x.status === input.status)) return;
      // Deployment is not a side effect of status changes; not automatically mark Go Live completed.
      if (input.status === 'completed' && stages.find(x => x.id === input.stage_id)?.title.includes('עלייה לאוויר')) {
        throw new Error('Go-live stage requires manual launch verification');
      }
      tx.update(ref, {
        stages: stages.map(x => x.id === input.stage_id ? { ...x, status: input.status } : x),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.create(audits.doc(), audit(grant.uid, 'set_project_stage', ref.id));
      changed = true;
    });
    return { updated: changed, project_id: input.project_id, stage_id: input.stage_id, status: input.status };
  }

  if (name === 'set_project_checklist_item') {
    const input = z.object({ org_id: identifier, project_id: identifier,
      field: z.enum(['inputs', 'launchChecks']), item_id: identifier, done: z.boolean() }).strict().parse(raw);
    await validateProject(input.org_id, input.project_id);
    const ref = projects.doc(input.project_id);
    let changed = false;
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.orgId !== input.org_id) throw new Error('Project not found for this client');
      const items = (snap.data()?.[input.field] || []) as Array<{ id: string; title: string; done: boolean }>;
      const entry = items.find(x => x.id === input.item_id);
      if (!entry) throw new Error('Checklist item not found');
      if (entry.done === input.done) return;
      if (input.done && /אישור הלקוח|client sign-off/i.test(entry.title)) {
        throw new Error('Client sign-off requires manual evidence');
      }
      tx.update(ref, {
        [input.field]: items.map(x => x.id === input.item_id ? { ...x, done: input.done } : x),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.create(audits.doc(), audit(grant.uid, 'set_project_checklist_item', ref.id));
      changed = true;
    });
    return { updated: changed, project_id: input.project_id, field: input.field,
      item_id: input.item_id, done: input.done };
  }

  if (name === 'import_proposal_draft') {
    const input = importSchema.parse(raw);
    if (input.max_hours < input.min_hours) throw new Error('Invalid project hours range');
    const baseMinor = Math.round(input.max_hours * input.hourly_rate_minor);
    if (!Number.isSafeInteger(baseMinor) || baseMinor <= 0) throw new Error('Invalid proposal cap');
    const total = Math.round(baseMinor * (1 + input.tax_rate));
    const deposit = Math.round(total * input.deposit_percent / 100);
    const report = input.reported_deposit_minor || 0;
    if (report > total) throw new Error('Reported deposit is greater than proposal total');
    const content = buildContent(input);
    validateProposalContent(content);
    validateProposalCap(content, [{ quantity: input.max_hours, unitPrice: input.hourly_rate_minor }]);
    await validateProject(input.org_id, input.project_id);

    // Idempotent per source document and owning organization. Cannot create parallel
    // proposals just by changing a title. Never mutate an existing commercial record.
    const stableId = 'mcp_quote_' + tokenHash(input.org_id + '|' + input.source_url).slice(0, 32);
    const ref = requests.doc(stableId);
    const existing = await requests.where('orgId', '==', input.org_id).limit(500).get();
    if (existing.size === 500) throw new Error('Too many requests to safely deduplicate');
    const duplicate = existing.docs.find(x => {
      const p = x.data();
      return Boolean(p.isBillable || p.publicToken || p.requestRole === 'bundle') &&
        (p.externalProposalSourceUrl === input.source_url || normalize(p.title || '') === normalize(input.title));
    });
    if (duplicate && duplicate.id !== stableId) {
      return { created: false, duplicate: true, proposal_id: duplicate.id, project_id: duplicate.data().projectId || null };
    }
    const token = randomUUID();
    let created = false;
    await db.runTransaction(async tx => {
      const [current, project] = await Promise.all([tx.get(ref), tx.get(projects.doc(input.project_id))]);
      if (!project.exists || project.data()?.orgId !== input.org_id) throw new Error('Project not found for this client');
      if (project.data()?.workMode === 'pro_bono') throw new Error('PRO_BONO_NO_BILLING');
      if (current.exists) {
        if (current.data()?.orgId !== input.org_id) throw new Error('Conflicting proposal');
        return;
      }
      tx.create(ref, {
        orgId: input.org_id, projectId: input.project_id,
        title: input.title, description: input.objective,
        type: 'other', priority: 'NORMAL', tags: ['quote', 'external-import'],
        status: 'DRAFT', isBillable: true, requestRole: 'standalone',
        attachmentIds: [], commentCount: 0, lineItems: [{
          id: 'hourly-cap', title: 'שעות עבודה – תקרת מסגרת', description:
            'חיוב לפי שעות בפועל, עד לתקרה המקורית; לא מחיר סופי קבוע.',
          quantity: input.max_hours, unitPrice: input.hourly_rate_minor, pricingType: 'hourly',
        }],
        taxRate: input.tax_rate, subtotal: baseMinor, taxAmount: total - baseMinor,
        totalAmount: total, currency: input.currency, paymentRequired: deposit > 0,
        depositAmount: deposit, amountPaid: 0, balanceDue: total, paymentStatus:
          deposit > 0 ? 'pending' : 'not_required', paymentProvider: null,
        billingMode: 'manual_installments',
        reportedDepositMinor: report,
        reportedDepositStatus: report > 0 ? 'client_reported_unverified' : 'not_reported',
        reportedDepositDate: input.reported_deposit_date || null,
        externalInvoiceReference: input.external_invoice_reference || null,
        externalProposalSourceUrl: input.source_url,
        agencyNotes: input.agency_notes || '',
        clientName: input.client_name || null, clientEmail: input.client_email || null,
        terms: input.terms, proposalContent: content, proposalVersion: 0,
        publicToken: token, publicAccessEnabled: false,
        createdBy: grant.uid, createdByName: grant.uid,
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      tx.create(audits.doc(), audit(grant.uid, 'import_proposal_draft', ref.id));
      created = true;
    });
    return {
      created, duplicate: !created, proposal_id: ref.id, project_id: input.project_id,
      status: 'DRAFT', total_cap_minor: total, reported_deposit_minor: report,
      verified_paid_minor: 0, deposit_status: report ? 'client_reported_unverified' : 'not_reported',
      email_sent: false, invoice_created: false,
    };
  }

  if (name === 'link_proposal_to_project') {
    const input = z.object({ org_id: identifier, project_id: identifier, proposal_id: identifier }).strict().parse(raw);
    await validateProject(input.org_id, input.project_id);
    await validateProposal(input.org_id, input.proposal_id);
    const ref = requests.doc(input.proposal_id);
    let changed = false;
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.orgId !== input.org_id) throw new Error('Proposal not found for this client');
      if (snap.data()?.projectId === input.project_id) return;
      if (snap.data()?.lockedAt || ['ACCEPTED', 'PAID'].includes(snap.data()?.status)) {
        throw new Error('Accepted or paid proposal linkage cannot be silently changed');
      }
      tx.update(ref, { projectId: input.project_id, updatedAt: FieldValue.serverTimestamp() });
      tx.create(audits.doc(), audit(grant.uid, 'link_proposal_to_project', ref.id));
      changed = true;
    });
    return { updated: changed, org_id: input.org_id, project_id: input.project_id, proposal_id: input.proposal_id };
  }

  if (name === 'get_proposal_reconciliation') {
    const input = z.object({ org_id: identifier, proposal_id: identifier }).strict().parse(raw);
    const snap = await validateProposal(input.org_id, input.proposal_id);
    const p = snap.data() || {};
    const total = Number(p.totalAmount || 0), materializedPaid = Number(p.amountPaid || 0);
    const reported = Number(p.reportedDepositMinor || 0);
    const ledger = await db.collection('portal_payments').where('requestId', '==', snap.id).limit(500).get();
    const paidDocs = ledger.docs.filter(doc => {
      const row = doc.data();
      return row.orgId === input.org_id &&
        (row.status === 'paid' || (!row.status && !!row.paidAt)) &&
        row.status !== 'refunded' && row.status !== 'canceled';
    });
    const ledgerPaid = paidDocs.reduce((sum, doc) => sum + Number(doc.data().amount || 0), 0);
    const ledgerTruncated = ledger.size === 500;
    // A materialized aggregate is useful, but must not be presented as an independently
    // reconciled bank receipt. Report any divergence rather than hiding it.
    const paidForProjection = Math.max(materializedPaid, ledgerPaid);
    return { proposal_id: snap.id, project_id: p.projectId || null,
      currency: p.currency || null, status: p.status || null,
      estimated_cap_minor: total,
      verified_paid_minor: ledgerPaid,
      materialized_paid_minor: materializedPaid,
      verified_ledger_entries: paidDocs.length,
      ledger_truncated: ledgerTruncated,
      reconciliation_mismatch: ledgerPaid !== materializedPaid || ledgerTruncated,
      canonical_balance_due_minor: Math.max(0, total - materializedPaid),
      reported_deposit_minor: reported,
      reported_status: p.reportedDepositStatus || 'not_reported',
      reported_at: p.reportedDepositDate || null,
      unverified_estimated_remaining_minor: Math.max(0, total - Math.max(reported, paidForProjection)),
      deposit_required_minor: p.depositAmount || 0,
      external_invoice_reference: p.externalInvoiceReference || null,
      disclaimer: 'The ledger is an application record, not independent bank proof. Client-reported transfers are not verified payments. All balances remain provisional until actual hours and tax reconciliation.',
    };
  }
  throw new Error('Unknown tool');
}
