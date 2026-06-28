import 'server-only';
import * as admin from 'firebase-admin';
import { randomUUID } from 'node:crypto';
import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from '@/lib/auth/server-auth';
import {
  BillingDocumentType,
  BillingProfile,
  Currency,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
  Request,
} from '@/lib/types/portal';

const REQUESTS = 'portal_requests';
const PAYMENTS = 'portal_payments';
const PROFILES = 'portal_billing_profiles';
const USERS = 'portal_users';
const SETTINGS = 'system_settings';
const ACTIVITIES = 'portal_activities';
const FINANCE_ROLES = new Set(['owner', 'admin', 'sales_manager', '']);
const SETTINGS_ROLES = new Set(['owner', 'admin', '']);

export const canRecordRequestPayment = (role?: string) => FINANCE_ROLES.has(role ?? '');
export const canUpdateBillingProfile = (role?: string) => SETTINGS_ROLES.has(role ?? '');
export function validateRequestPaymentAmount(amount: number, balanceDue: number) {
  if (!Number.isInteger(amount) || amount < 1 || amount > balanceDue) throw new Error('INVALID_AMOUNT');
}

type RequestDoc = Omit<Request, 'id'>;
type PaymentDoc = {
  requestId: string;
  orgId: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  type?: 'payment';
  label?: string;
  status?: 'paid';
  provider?: 'paypal' | 'manual';
  reference?: string;
  notes?: string;
  paidAt: admin.firestore.Timestamp;
  recordedBy: string;
  recordedByName?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
};

function db() {
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  return adminDb;
}

function now() {
  return admin.firestore.FieldValue.serverTimestamp();
}

function toTimestamp(value?: Date) {
  return value ? admin.firestore.Timestamp.fromDate(value) : admin.firestore.Timestamp.now();
}

function getSubtotal(request: Pick<Request, 'subtotal' | 'lineItems' | 'totalAmount' | 'taxRate'>) {
  return (
    request.subtotal ??
    request.lineItems?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) ??
    Math.round((request.totalAmount ?? 0) / (1 + (request.taxRate ?? 0)))
  );
}

export function calculateRequestBillingTotals(
  request: Pick<Request, 'subtotal' | 'lineItems' | 'totalAmount' | 'taxRate'>,
  defaultTaxRate = 0
) {
  const subtotal = getSubtotal(request);
  const taxRate = request.taxRate ?? defaultTaxRate;
  const taxAmount = Math.round(subtotal * taxRate);
  return { subtotal, taxRate, taxAmount, totalAmount: subtotal + taxAmount };
}

export function recalculateRequestPaymentStatus(
  request: Pick<Request, 'subtotal' | 'lineItems' | 'totalAmount' | 'taxRate'>,
  payments: Array<Pick<PaymentRecord, 'id' | 'amount' | 'method'>>,
  defaultTaxRate = 0
) {
  const totals = calculateRequestBillingTotals(request, defaultTaxRate);
  const amountPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balanceDue = Math.max(0, totals.totalAmount - amountPaid);
  const paymentStatus: PaymentStatus =
    balanceDue === 0 && totals.totalAmount > 0
      ? 'paid'
      : amountPaid > 0
        ? 'partially_paid'
        : 'unpaid';
  return {
    ...totals,
    amountPaid,
    balanceDue,
    paymentStatus,
    paymentIds: payments.map(payment => payment.id),
    paymentAllocations: payments.map(payment => ({
      paymentId: payment.id,
      amount: payment.amount,
      method: payment.method,
    })),
  };
}

export function getDocumentTypeForRequest(request: Pick<Request, 'paymentStatus' | 'paidAt'>): BillingDocumentType {
  if (request.paymentStatus === 'paid' || request.paidAt) return 'payment_receipt';
  if (request.paymentStatus === 'partially_paid') return 'invoice';
  return 'payment_request';
}

async function getSession() {
  const session = await getServerSession();
  if (!session) throw new Error('UNAUTHENTICATED');
  return session;
}

async function getUser(uid: string) {
  return (await db().collection(USERS).doc(uid).get()).data();
}

async function assertAgencyRole(uid: string, roles: Set<string>) {
  const user = await getUser(uid);
  const isAgency = user?.isAgency === true || user?.accountType === 'AGENCY';
  if (!isAgency || !roles.has(typeof user?.agencyRole === 'string' ? user.agencyRole : '')) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

async function assertRequestAccess(uid: string, request: RequestDoc) {
  const user = await getUser(uid);
  if (user?.isAgency === true || user?.accountType === 'AGENCY') return;
  const member = await db().collection('portal_members').doc(`${request.orgId}_${uid}`).get();
  if (
    !member.exists &&
    request.createdBy !== uid &&
    request.clientUserId !== uid &&
    request.clientEmail !== user?.email
  ) {
    throw new Error('FORBIDDEN');
  }
}

async function requestSnapshot(requestId: string) {
  const snapshot = await db().collection(REQUESTS).doc(requestId).get();
  if (!snapshot.exists) throw new Error('NOT_FOUND');
  return snapshot;
}

function serializePayment(snapshot: admin.firestore.DocumentSnapshot): PaymentRecord {
  return { id: snapshot.id, ...(snapshot.data() as PaymentDoc) } as unknown as PaymentRecord;
}

function legacyPayment(requestId: string, request: RequestDoc): PaymentRecord | null {
  if (!request.paymentId || !(request.paidAt || request.status === 'PAID')) return null;
  const stamp = request.paidAt ?? request.updatedAt;
  return {
    id: `legacy_${request.paymentId}`,
    requestId,
    orgId: request.orgId,
    amount: request.amountPaid ?? request.totalAmount ?? 0,
    currency: request.currency ?? 'USD',
    method: request.paymentMethod ?? 'paypal',
    reference: request.paymentId,
    paidAt: stamp,
    recordedBy: 'legacy',
    createdAt: stamp,
    updatedAt: stamp,
    isLegacy: true,
  };
}

export async function listRequestPayments(requestId: string): Promise<PaymentRecord[]> {
  const session = await getSession();
  const request = (await requestSnapshot(requestId)).data() as RequestDoc;
  await assertRequestAccess(session.uid, request);
  const snapshot = await db().collection(PAYMENTS).where('requestId', '==', requestId).get();
  const payments = snapshot.docs
    .filter(doc => {
      const payment = doc.data() as PaymentDoc;
      return (!payment.type || payment.type === 'payment') && Boolean(payment.paidAt);
    })
    .map(serializePayment)
    .sort((a, b) => b.paidAt.toMillis() - a.paidAt.toMillis());
  const legacy = payments.length === 0 ? legacyPayment(requestId, request) : null;
  return legacy ? [legacy] : payments;
}

async function createPayment(input: {
  requestId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  paidAt?: Date;
  recordedBy: string;
  recordedByName?: string;
  id?: string;
}) {
  const database = db();
  const requestRef = database.collection(REQUESTS).doc(input.requestId);
  const paymentRef = database.collection(PAYMENTS).doc(input.id ?? randomUUID());

  await database.runTransaction(async transaction => {
    const [requestSnap, existingPayment] = await Promise.all([
      transaction.get(requestRef),
      transaction.get(paymentRef),
    ]);
    if (existingPayment.exists) return;
    const request = requestSnap.data() as RequestDoc | undefined;
    if (!request) throw new Error('NOT_FOUND');
    if (request.publicToken && request.paymentRequired) throw new Error('PROPOSAL_MANAGED');
    if (!request.isBillable) throw new Error('NOT_BILLABLE');
    const existing = await transaction.get(database.collection(PAYMENTS).where('requestId', '==', input.requestId));
    const payments = existing.docs.map(serializePayment);
    const current = recalculateRequestPaymentStatus(request, payments);
    validateRequestPaymentAmount(input.amount, current.balanceDue);
    const paidAt = toTimestamp(input.paidAt);
    const payment: PaymentDoc = {
      requestId: input.requestId,
      orgId: request.orgId,
      amount: input.amount,
      currency: request.currency ?? 'USD',
      method: input.method,
      type: 'payment',
      label: input.notes?.trim() || 'Request payment',
      status: 'paid',
      provider: input.method === 'paypal' ? 'paypal' : 'manual',
      paidAt,
      recordedBy: input.recordedBy,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      ...(input.reference?.trim() ? { reference: input.reference.trim() } : {}),
      ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
      ...(input.recordedByName ? { recordedByName: input.recordedByName } : {}),
    };
    const next = recalculateRequestPaymentStatus(request, [...payments, { id: paymentRef.id, ...payment }]);
    transaction.set(paymentRef, payment);
    transaction.update(requestRef, {
      ...next,
      status: next.paymentStatus === 'paid' ? 'PAID' : request.status,
      paymentId: paymentRef.id,
      paymentMethod: input.method,
      paidAt: next.paymentStatus === 'paid' ? paidAt : null,
      updatedAt: now(),
    });
    const activity = (action: string, details: Record<string, unknown>) =>
      transaction.set(database.collection(ACTIVITIES).doc(), {
        orgId: request.orgId,
        requestId: input.requestId,
        userId: input.recordedBy,
        userName: input.recordedByName ?? input.recordedBy,
        action,
        details,
        createdAt: now(),
      });
    activity('RECORDED_PAYMENT', { paymentId: paymentRef.id, amount: input.amount, method: input.method });
    activity('PAYMENT_STATUS_UPDATED', { paymentStatus: next.paymentStatus, balanceDue: next.balanceDue });
  });
  const payment = serializePayment(await paymentRef.get());
  const { syncProfitSplitForRequest } = await import('@/lib/services/profit-split-sync-server');
  await syncProfitSplitForRequest(input.requestId);
  return payment;
}

export async function recordManualRequestPayment(
  requestId: string,
  input: { amount: number; method: Exclude<PaymentMethod, 'manual'>; reference?: string; notes?: string; paidAt?: Date }
) {
  const session = await getSession();
  const user = await assertAgencyRole(session.uid, FINANCE_ROLES);
  return createPayment({ requestId, ...input, recordedBy: session.uid, recordedByName: user?.name ?? session.email });
}

export async function recordVerifiedPayPalRequestPayment(requestId: string, orderId: string) {
  const session = await getSession();
  const request = (await requestSnapshot(requestId)).data() as RequestDoc;
  await assertRequestAccess(session.uid, request);
  const { getPayPalOrder } = await import('@/lib/services/paypal-server');
  const order = await getPayPalOrder(orderId);
  const purchase = order.purchase_units?.[0];
  const paidAmount = Math.round(Number(purchase?.amount?.value ?? 0) * 100);
  if (
    order.status !== 'COMPLETED' ||
    purchase?.reference_id !== requestId ||
    purchase?.amount?.currency_code !== (request.currency ?? 'USD')
  ) throw new Error('INVALID_PAYPAL_ORDER');
  return createPayment({
    id: `paypal_${orderId}`,
    requestId,
    amount: paidAmount,
    method: 'paypal',
    reference: orderId,
    recordedBy: session.uid,
    recordedByName: session.email,
  });
}

export async function resolveBillingProfileOwnerId(bootstrapUid?: string) {
  const settingsRef = db().collection(SETTINGS).doc('general');
  const settings = (await settingsRef.get()).data();
  if (settings?.billingProfileOwnerId) return settings.billingProfileOwnerId as string;
  if (!bootstrapUid) return null;
  const user = await getUser(bootstrapUid);
  const role = typeof user?.agencyRole === 'string' ? user.agencyRole : '';
  const isAgency = user?.isAgency === true || user?.accountType === 'AGENCY';
  if (!isAgency || !canUpdateBillingProfile(role)) return null;
  await settingsRef.set({ billingProfileOwnerId: bootstrapUid }, { merge: true });
  return bootstrapUid;
}

export async function getBillingProfile(): Promise<BillingProfile | null> {
  const session = await getSession();
  const ownerId = await resolveBillingProfileOwnerId(session.uid);
  if (!ownerId) return null;
  const snapshot = await db().collection(PROFILES).doc(ownerId).get();
  return snapshot.exists ? ({ id: snapshot.id, ...snapshot.data() } as BillingProfile) : null;
}

export async function updateBillingProfile(profile: BillingProfile) {
  const session = await getSession();
  const user = await assertAgencyRole(session.uid, SETTINGS_ROLES);
  const ownerId = await resolveBillingProfileOwnerId(session.uid);
  if (!ownerId) throw new Error('NOT_FOUND');
  await db().collection(PROFILES).doc(ownerId).set({ ...profile, updatedAt: now() }, { merge: true });
  await db().collection(ACTIVITIES).add({
    orgId: 'agency',
    userId: session.uid,
    userName: user?.name ?? session.email ?? session.uid,
    action: 'UPDATED_BILLING_PROFILE',
    createdAt: now(),
  });
  return getBillingProfile();
}
