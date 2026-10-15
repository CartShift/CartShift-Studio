import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from '@/lib/auth/server-auth';
import { hasPermission, PERMISSIONS } from '@/lib/utils/permissions';
import {
  PROJECT_RECORD_KINDS, initialProjectRecordStatus,
  validProjectRecordTransition, validateProjectPrivateRecord,
  type NewProjectPrivateRecord, type ProjectRecordKind, type ProjectRecordStatus,
} from '@/lib/domain/project-operations';

export const dynamic = 'force-dynamic';

const id = z.string().regex(/^[\w-]{6,128}$/);
const schema = z.object({
  kind: z.enum(PROJECT_RECORD_KINDS),
  title: z.string().trim().min(1).max(160),
  details: z.string().max(3000),
  sourceUrl: z.string().max(1024).optional(),
  owner: z.string().max(100).optional(),
  dueDate: z.string().max(10).optional(),
  hours: z.number().optional(),
}).strict();

type RouteCtx = { params: Promise<{ projectId: string }> };

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (message === 'ADMIN_NOT_CONFIGURED') return NextResponse.json({ error: 'Unavailable' }, { status: 503 });
  if (message === 'INVALID') return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  return NextResponse.json({ error: 'Unable to process private project records' }, { status: 500 });
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return !origin || origin === request.nextUrl.origin;
}

async function privateContext(request: NextRequest, params: RouteCtx['params']) {
  const session = await getServerSession(request);
  if (!session) throw new Error('UNAUTHENTICATED');
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  const projectId = id.safeParse((await params).projectId);
  if (!projectId.success) throw new Error('NOT_FOUND');
  const [actor, project] = await Promise.all([
    adminDb.collection('portal_users').doc(session.uid).get(),
    adminDb.collection('portal_projects').doc(projectId.data).get(),
  ]);
  const user = actor.data();
  if (!actor.exists || (user?.isAgency !== true && user?.accountType !== 'AGENCY') ||
    user?.status === 'inactive' || user?.status === 'suspended') throw new Error('FORBIDDEN');
  if (!project.exists || !project.data()?.orgId) throw new Error('NOT_FOUND');
  return {
    uid: session.uid,
    canEdit: hasPermission(user?.agencyRole ?? 'owner', PERMISSIONS.MANAGE_PROJECTS),
    projectId: projectId.data,
    records: adminDb.collection('portal_projects').doc(projectId.data).collection('private_records'),
  };
}

export async function GET(request: NextRequest, context: RouteCtx) {
  try {
    const { records } = await privateContext(request, context.params);
    const snapshot = await records.orderBy('createdAt', 'desc').limit(100).get();
    const items = snapshot.docs.map(d => {
      const row = d.data();
      return { id: d.id, kind: row.kind, title: row.title, details: row.details,
        status: row.status, sourceUrl: row.sourceUrl, owner: row.owner, dueDate: row.dueDate,
        hours: row.hours ?? null, createdBy: row.createdBy,
        createdAtMs: row.createdAt?.toMillis?.() ?? 0 };
    });
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest, context: RouteCtx) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  try {
    const { uid, records, canEdit } = await privateContext(request, context.params);
    if (!canEdit) throw new Error('FORBIDDEN');
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new Error('INVALID');
    const payload: NewProjectPrivateRecord = parsed.data;
    if (validateProjectPrivateRecord(payload)) throw new Error('INVALID');
    const doc = await records.add({
      kind: payload.kind, title: payload.title.trim(), details: payload.details.trim(),
      status: initialProjectRecordStatus(payload.kind),
      sourceUrl: payload.sourceUrl?.trim() || '', owner: payload.owner?.trim() || '',
      dueDate: payload.dueDate || '',
      ...(payload.kind === 'time' ? { hours: payload.hours } : {}),
      createdBy: uid, createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ id: doc.id }, { status: 201,
      headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest, context: RouteCtx) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  try {
    const { records, canEdit } = await privateContext(request, context.params);
    if (!canEdit) throw new Error('FORBIDDEN');
    const parsed = z.object({
      recordId: id,
      status: z.enum(['open', 'confirmed', 'passed', 'failed', 'done']),
    }).strict().safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new Error('INVALID');
    const { recordId, status } = parsed.data;
    if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
    await adminDb.runTransaction(async transaction => {
      const recordRef = records.doc(recordId);
      const snapshot = await transaction.get(recordRef);
      if (!snapshot.exists) throw new Error('NOT_FOUND');
      const kind = snapshot.data()?.kind as ProjectRecordKind;
      if (kind === 'time' || !validProjectRecordTransition(kind, status as ProjectRecordStatus)) {
        throw new Error('INVALID');
      }
      transaction.update(recordRef, { status, updatedAt: FieldValue.serverTimestamp() });
    });
    return NextResponse.json({ updated: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
