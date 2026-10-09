import 'server-only';

import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { AUDIT, type TokenGrant, agencyActor, firestore, may, tokenHash } from '@/lib/mcp/connection';
import { buildProjectTemplate } from '@/lib/utils/project-workflow';

const id = z.string().min(6).max(128).regex(/^[\w-]+$/);
const short = z.string().trim().min(1).max(240);
const note = z.string().trim().min(1).max(4000);
const orgArg = z.object({ org_id: id }).strict();
const projectArg = z.object({ org_id: id, project_id: id }).strict();
const itemArg = z.object({ org_id: id, work_item_id: id }).strict();
const projectStatuses = z.enum(['planning', 'in_progress', 'client_review', 'blocked']);
const templates = z.enum(['shopify_theme', 'catalog_launch', 'seo', 'custom']);
const blockerOwners = z.enum(['agency', 'client', 'vendor']);

const definition = (name: string, description: string, scope: 'work:read' | 'work:write',
  properties: Record<string, unknown>, required: string[] = []) => ({
    name, description, scope,
    inputSchema: { type: 'object', properties, required, additionalProperties: false },
  });

const identifier = { type: 'string', minLength: 6, maxLength: 128 };
const org = { org_id: identifier };
const project = { ...org, project_id: identifier };
const work = { ...org, work_item_id: identifier };

export const EXTENDED_TOOL_DEFS = [
  definition('list_projects', 'List real client project workspaces, their stages and open blockers. Scoped to an existing organization.',
    'work:read', org, ['org_id']),
  definition('get_project', 'Read one project including milestones, review/checklist state, time logs and all client-visible notes.',
    'work:read', project, ['org_id', 'project_id']),
  definition('create_project', 'Create a client-visible project from a standard template. Use only verified client-safe information; deduplicates titles.',
    'work:write', { ...org, title: { type: 'string' }, template: { type: 'string', enum: templates.options },
      locale: { type: 'string', enum: ['en', 'he'] }, summary: { type: 'string' } }, ['org_id', 'title', 'template']),
  definition('update_project', 'Update an existing CLIENT-VISIBLE project title, summary, next step, or working status. Does not mark launch-ready or completed.',
    'work:write', { ...project, patch: { type: 'object', properties: {
      title: { type: 'string' }, summary: { type: 'string' }, nextStep: { type: 'string' },
      status: { type: 'string', enum: projectStatuses.options },
    }, additionalProperties: false } }, ['org_id', 'project_id', 'patch']),
  definition('add_project_blocker', 'Add a client-visible blocker to a project. Does not contact the vendor or client.',
    'work:write', { ...project, title: { type: 'string' }, owner: { type: 'string', enum: blockerOwners.options },
      next_action: { type: 'string' } }, ['org_id', 'project_id', 'title', 'owner', 'next_action']),
  definition('resolve_project_blocker', 'Mark a specific verified project blocker resolved. Does not claim an external system was fixed.',
    'work:write', { ...project, blocker_id: identifier }, ['org_id', 'project_id', 'blocker_id']),
  definition('add_project_update', 'Publish a project update INSIDE the client-visible CartShift project. Does not send an email.',
    'work:write', { ...project, text: { type: 'string' } }, ['org_id', 'project_id', 'text']),
  definition('link_work_item_to_project', 'Associate an existing work item with a project within the SAME client organization.',
    'work:write', { ...work, project_id: identifier }, ['org_id', 'work_item_id', 'project_id']),
  definition('list_proposals', 'List client commercial proposals and their real payment statuses; read-only.',
    'work:read', org, ['org_id']),
  definition('get_proposal', 'Read proposal pricing, approved content and terms; never expose public payment tokens or signing metadata.',
    'work:read', { ...org, proposal_id: identifier }, ['org_id', 'proposal_id']),
  definition('list_consultations', 'List internal CartShift consultation records; these are not live calendar events.',
    'work:read', org, ['org_id']),
  definition('get_consultation', 'Read one consultation record, including its internal agenda and follow-up notes.',
    'work:read', { ...org, consultation_id: identifier }, ['org_id', 'consultation_id']),
  definition('list_client_activity', 'Read the latest organization activity history for reconciliation.',
    'work:read', { ...org, limit: { type: 'integer', minimum: 1, maximum: 100 } }, ['org_id']),
  definition('list_work_item_comments', 'Read a client request comment thread including internal agency notes.',
    'work:read', work, ['org_id', 'work_item_id']),
  definition('add_internal_work_comment', 'Add an internal-only agency comment to a request. Never posts client-visible messages or sends notifications.',
    'work:write', { ...work, content: { type: 'string' } }, ['org_id', 'work_item_id', 'content']),
] as const;

const normalize = (s: string) => s.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
const safe = (value: unknown) => JSON.parse(JSON.stringify(value));
const db = () => firestore();
const audit = (uid: string, action: string, targetId: string) => ({
  uid, action, targetId, at: Date.now(),
});
const pick = (data: Record<string, unknown>, keys: readonly string[]) =>
  Object.fromEntries(keys.filter(key => data[key] !== undefined).map(key => [key, safe(data[key])]));

async function organizationExists(orgId: string) {
  const snap = await db().collection('portal_organizations').doc(orgId).get();
  if (!snap.exists || snap.data()?.removedAt || ['inactive', 'suspended'].includes(snap.data()?.status)) {
    throw new Error('Organization not found or inactive');
  }
}

async function projectExists(orgId: string, projectId: string) {
  await organizationExists(orgId);
  const snap = await db().collection('portal_projects').doc(projectId).get();
  if (!snap.exists || snap.data()?.orgId !== orgId) throw new Error('Project not found for this client');
  return snap;
}

async function requestExists(orgId: string, requestId: string) {
  await organizationExists(orgId);
  const snap = await db().collection('portal_requests').doc(requestId).get();
  if (!snap.exists || snap.data()?.orgId !== orgId) throw new Error('Work item not found for this client');
  return snap;
}

const projectFields = ['orgId', 'title', 'summary', 'nextStep', 'status', 'template',
  'stages', 'blockers', 'deliverables', 'launchChecks', 'inputs', 'workLogs', 'updates',
  'changes', 'reviewRevisions', 'scope', 'createdBy', 'createdAt', 'updatedAt'] as const;

export async function callExtendedTool(name: string, raw: unknown, grant: TokenGrant): Promise<unknown> {
  const def = EXTENDED_TOOL_DEFS.find(item => item.name === name);
  if (!def) throw new Error('Unknown tool');
  may(grant, def.scope);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Arguments must be an object');
  const input = raw as Record<string, unknown>;
  const database = db();
  const projects = database.collection('portal_projects');
  const requests = database.collection('portal_requests');
  const audits = database.collection(AUDIT);

  if (name === 'list_projects') {
    const { org_id } = orgArg.parse(input);
    await organizationExists(org_id);
    const snap = await projects.where('orgId', '==', org_id).limit(200).get();
    return { projects: snap.docs.map(doc => {
      const p = doc.data();
      return { id: doc.id, ...pick(p, ['title', 'template', 'summary', 'nextStep', 'status', 'scope', 'updatedAt']),
        openBlockers: (p.blockers || []).filter((x: { resolved?: boolean }) => !x.resolved).length,
        stages: p.stages || [] };
    }), truncated: snap.size === 200 };
  }

  if (name === 'get_project') {
    const { org_id, project_id } = projectArg.parse(input);
    const snap = await projectExists(org_id, project_id);
    return { id: snap.id, ...pick(snap.data() || {}, projectFields) };
  }

  if (name === 'create_project') {
    const { org_id, title, template, locale = 'he', summary = '' } = z.object({
      org_id: id, title: short, template: templates, locale: z.enum(['en', 'he']).optional(),
      summary: z.string().trim().max(4000).optional(),
    }).strict().parse(input);
    await organizationExists(org_id);
    const existing = await projects.where('orgId', '==', org_id).limit(200).get();
    if (existing.size === 200) throw new Error('Project list is too large to safely deduplicate');
    const duplicate = existing.docs.find(doc => normalize(doc.data().title || '') === normalize(title));
    if (duplicate) return { created: false, duplicate: true, project_id: duplicate.id };
    const ref = projects.doc('mcp_project_' + tokenHash(org_id + '|' + normalize(title)).slice(0, 32));
    let created = false;
    await database.runTransaction(async tx => {
      const prior = await tx.get(ref);
      if (prior.exists) {
        if (prior.data()?.orgId !== org_id) throw new Error('Conflicting project');
        return;
      }
      tx.create(ref, {
        orgId: org_id, title, template, summary, nextStep: '', status: 'planning',
        ...buildProjectTemplate(template, locale), blockers: [], deliverables: [], workLogs: [],
        changes: [], updates: [], reviewRevisions: {},
        scope: { minHours: 0, maxHours: 0, rateCents: 0, currency: 'ILS' },
        createdBy: grant.uid, createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.create(audits.doc(), audit(grant.uid, 'create_project', ref.id));
      created = true;
    });
    return { created, duplicate: !created, project_id: ref.id, client_visible: true };
  }

  if (name === 'update_project') {
    const { org_id, project_id, patch } = z.object({
      org_id: id, project_id: id, patch: z.object({
        title: short.optional(), summary: z.string().trim().max(4000).optional(),
        nextStep: z.string().trim().max(2000).optional(),
        status: projectStatuses.optional(),
      }).strict(),
    }).strict().parse(input);
    if (!Object.keys(patch).length) throw new Error('Empty project patch');
    await projectExists(org_id, project_id);
    const ref = projects.doc(project_id);
    await database.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.orgId !== org_id) throw new Error('Project not found for this client');
      tx.update(ref, { ...patch, updatedAt: FieldValue.serverTimestamp() });
      tx.create(audits.doc(), audit(grant.uid, 'update_project', project_id));
    });
    return { updated: true, project_id, fields: Object.keys(patch), client_visible: true };
  }

  if (name === 'add_project_blocker') {
    const { org_id, project_id, title, owner, next_action } = z.object({
      org_id: id, project_id: id, title: short, owner: blockerOwners, next_action: note,
    }).strict().parse(input);
    await projectExists(org_id, project_id);
    const ref = projects.doc(project_id);
    let blockerId = '';
    let duplicate = false;
    await database.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.orgId !== org_id) throw new Error('Project not found for this client');
      const blockers = (snap.data()?.blockers || []) as Array<{ id: string; title: string; resolved: boolean }>;
      const match = blockers.find(x => normalize(x.title) === normalize(title) && !x.resolved);
      if (match) { blockerId = match.id; duplicate = true; return; }
      if (blockers.length >= 100) throw new Error('Project blocker limit reached');
      blockerId = 'blocker-' + randomUUID();
      tx.update(ref, {
        blockers: [...blockers, { id: blockerId, title, owner, nextAction: next_action, resolved: false }],
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.create(audits.doc(), audit(grant.uid, 'add_project_blocker', project_id));
    });
    return { created: !duplicate, duplicate, project_id, blocker_id: blockerId, client_visible: true };
  }

  if (name === 'resolve_project_blocker') {
    const { org_id, project_id, blocker_id } = z.object({
      org_id: id, project_id: id, blocker_id: id,
    }).strict().parse(input);
    await projectExists(org_id, project_id);
    const ref = projects.doc(project_id);
    let updated = false;
    await database.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.orgId !== org_id) throw new Error('Project not found for this client');
      const blockers = (snap.data()?.blockers || []) as Array<{ id: string; resolved: boolean }>;
      if (!blockers.some(x => x.id === blocker_id)) throw new Error('Project blocker not found');
      if (blockers.some(x => x.id === blocker_id && x.resolved)) return;
      tx.update(ref, { blockers: blockers.map(x => x.id === blocker_id ? { ...x, resolved: true } : x),
        updatedAt: FieldValue.serverTimestamp() });
      tx.create(audits.doc(), audit(grant.uid, 'resolve_project_blocker', project_id));
      updated = true;
    });
    return { updated, project_id, blocker_id };
  }

  if (name === 'add_project_update') {
    const { org_id, project_id, text } = z.object({ org_id: id, project_id: id, text: note }).strict().parse(input);
    await projectExists(org_id, project_id);
    const actor = await agencyActor(grant.uid);
    const ref = projects.doc(project_id);
    const updateId = 'update-' + randomUUID();
    await database.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.orgId !== org_id) throw new Error('Project not found for this client');
      const updates = snap.data()?.updates || [];
      if (updates.length >= 200) throw new Error('Project update limit reached');
      tx.update(ref, { updates: [...updates, { id: updateId, text, createdAt: Date.now(), author: actor.name }],
        updatedAt: FieldValue.serverTimestamp() });
      tx.create(audits.doc(), audit(grant.uid, 'add_project_update', project_id));
    });
    return { created: true, project_id, update_id: updateId, client_visible: true, email_sent: false };
  }

  if (name === 'link_work_item_to_project') {
    const { org_id, work_item_id, project_id } = z.object({
      org_id: id, work_item_id: id, project_id: id,
    }).strict().parse(input);
    await projectExists(org_id, project_id);
    await requestExists(org_id, work_item_id);
    const ref = requests.doc(work_item_id);
    await database.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.orgId !== org_id) throw new Error('Work item not found for this client');
      tx.update(ref, { projectId: project_id, updatedAt: FieldValue.serverTimestamp() });
      tx.create(audits.doc(), audit(grant.uid, 'link_work_item_to_project', work_item_id));
    });
    return { linked: true, org_id, work_item_id, project_id };
  }

  if (name === 'list_proposals') {
    const { org_id } = orgArg.parse(input);
    await organizationExists(org_id);
    const snap = await requests.where('orgId', '==', org_id).limit(500).get();
    const proposals = snap.docs.filter(doc => {
      const p = doc.data();
      return p.isBillable || p.publicToken || p.requestRole === 'bundle';
    }).map(doc => ({
      id: doc.id, ...pick(doc.data(), ['title', 'description', 'status', 'currency',
        'totalAmount', 'amountPaid', 'balanceDue', 'paymentStatus', 'proposalVersion',
        'clientName', 'clientEmail', 'sentAt', 'acceptedAt', 'updatedAt']),
    }));
    return { proposals, truncated: snap.size === 500 };
  }

  if (name === 'get_proposal') {
    const { org_id, proposal_id } = z.object({ org_id: id, proposal_id: id }).strict().parse(input);
    const snap = await requestExists(org_id, proposal_id);
    const p = snap.data() || {};
    if (!p.isBillable && !p.publicToken && p.requestRole !== 'bundle') {
      throw new Error('Not a commercial proposal');
    }
    return { id: snap.id, ...pick(p, [
      'orgId', 'title', 'description', 'status', 'lineItems', 'subtotal', 'taxAmount', 'taxRate',
      'totalAmount', 'currency', 'validUntil', 'timeframe', 'workDeadline', 'agencyNotes',
      'clientName', 'clientEmail', 'proposalContent', 'proposalVersion', 'terms',
      'paymentRequired', 'depositAmount', 'amountPaid', 'balanceDue', 'paymentStatus',
      'relatedRequestId', 'requestRole', 'childRequestIds', 'sentAt', 'acceptedAt',
      'createdAt', 'updatedAt',
    ]) };
  }

  if (name === 'list_consultations') {
    const { org_id } = orgArg.parse(input);
    await organizationExists(org_id);
    const snap = await database.collection('portal_consultations').where('orgId', '==', org_id).limit(200).get();
    return { consultations: snap.docs.map(doc => ({ id: doc.id, ...pick(doc.data(), [
      'title', 'type', 'status', 'scheduledAt', 'duration', 'description', 'updatedAt',
    ]) })), truncated: snap.size === 200 };
  }

  if (name === 'get_consultation') {
    const { org_id, consultation_id } = z.object({ org_id: id, consultation_id: id }).strict().parse(input);
    await organizationExists(org_id);
    const snap = await database.collection('portal_consultations').doc(consultation_id).get();
    if (!snap.exists || snap.data()?.orgId !== org_id) throw new Error('Consultation not found for this client');
    return { id: snap.id, ...pick(snap.data() || {}, [
      'orgId', 'title', 'type', 'status', 'scheduledAt', 'duration', 'description',
      'agendaItems', 'meetingNotes', 'actionItems', 'externalCalendarLink',
      'createdBy', 'createdByName', 'createdAt', 'updatedAt',
    ]) };
  }

  if (name === 'list_client_activity') {
    const { org_id, limit = 30 } = z.object({
      org_id: id, limit: z.number().int().min(1).max(100).optional(),
    }).strict().parse(input);
    await organizationExists(org_id);
    const snap = await database.collection('portal_activities').where('orgId', '==', org_id).limit(200).get();
    const items = snap.docs.map(doc => ({ id: doc.id, ...pick(doc.data(), [
      'orgId', 'requestId', 'userId', 'userName', 'action', 'details', 'createdAt',
    ]) })).sort((a, b) => {
      const aTime = (a.createdAt as { seconds?: number } | undefined)?.seconds || 0;
      const bTime = (b.createdAt as { seconds?: number } | undefined)?.seconds || 0;
      return bTime - aTime;
    });
    return { activities: items.slice(0, limit), truncated: snap.size === 200 };
  }

  if (name === 'list_work_item_comments') {
    const { org_id, work_item_id } = itemArg.parse(input);
    await requestExists(org_id, work_item_id);
    const snap = await database.collection('portal_comments').where('requestId', '==', work_item_id)
      .where('orgId', '==', org_id).limit(150).get();
    return { comments: snap.docs.map(doc => ({ id: doc.id, ...pick(doc.data(), [
      'requestId', 'userName', 'content', 'isInternal', 'createdAt', 'updatedAt',
    ]) })).sort((a, b) => {
      const aTime = (a.createdAt as { seconds?: number } | undefined)?.seconds || 0;
      const bTime = (b.createdAt as { seconds?: number } | undefined)?.seconds || 0;
      return aTime - bTime;
    }), truncated: snap.size === 150 };
  }

  if (name === 'add_internal_work_comment') {
    const { org_id, work_item_id, content } = z.object({
      org_id: id, work_item_id: id, content: note,
    }).strict().parse(input);
    await requestExists(org_id, work_item_id);
    const actor = await agencyActor(grant.uid);
    const ref = requests.doc(work_item_id);
    const comment = database.collection('portal_comments').doc();
    // Match the portal comment sanitizer; never write client-visible lastComment for internal notes.
    const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    await database.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.data()?.orgId !== org_id) throw new Error('Work item not found for this client');
      tx.create(comment, {
        orgId: org_id, requestId: work_item_id, userId: grant.uid, userName: actor.name,
        content: escaped, isInternal: true, attachmentIds: [], parentId: null,
        mentions: [], reactions: {}, createdAt: FieldValue.serverTimestamp(),
      });
      tx.update(ref, { commentCount: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() });
      tx.create(audits.doc(), audit(grant.uid, 'add_internal_work_comment', work_item_id));
    });
    return { created: true, comment_id: comment.id, work_item_id, is_internal: true };
  }

  throw new Error('Unknown tool');
}
