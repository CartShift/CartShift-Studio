import { Timestamp } from 'firebase/firestore';
import { BillingProfile, PaymentMethod, PaymentRecord } from '@/lib/types/portal';

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Billing request failed');
  return payload as T;
}

function timestamp(value: any): Timestamp {
  if (value?.toDate) return value;
  return new Timestamp(value?._seconds ?? value?.seconds ?? 0, value?._nanoseconds ?? value?.nanoseconds ?? 0);
}

function normalizePayment(payment: PaymentRecord): PaymentRecord {
  return { ...payment, paidAt: timestamp(payment.paidAt), createdAt: timestamp(payment.createdAt), updatedAt: timestamp(payment.updatedAt) };
}

export async function getBillingProfile() {
  return (await readJson<{ profile: BillingProfile | null }>(await fetch('/api/portal/billing-profile', { cache: 'no-store' }))).profile;
}

export async function updateBillingProfile(profile: BillingProfile) {
  return (await readJson<{ profile: BillingProfile }>(await fetch('/api/portal/billing-profile', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile),
  }))).profile;
}

export async function getPaymentsForRequest(requestId: string) {
  const payload = await readJson<{ payments: PaymentRecord[] }>(await fetch(`/api/portal/requests/${encodeURIComponent(requestId)}/payments`, { cache: 'no-store' }));
  return payload.payments.map(normalizePayment);
}

export async function recordManualPayment(requestId: string, input: {
  amount: number; method: Exclude<PaymentMethod, 'manual'>; reference?: string; notes?: string; paidAt?: string;
}) {
  const payload = await readJson<{ payment: PaymentRecord }>(await fetch(`/api/portal/requests/${encodeURIComponent(requestId)}/payments/manual`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  }));
  return normalizePayment(payload.payment);
}

export async function recordPayPalPayment(requestId: string, orderId: string) {
  const payload = await readJson<{ payment: PaymentRecord }>(await fetch(`/api/portal/requests/${encodeURIComponent(requestId)}/payments/paypal`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }),
  }));
  return normalizePayment(payload.payment);
}
