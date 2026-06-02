import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestore = vi.hoisted(() => ({
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: vi.fn((date: Date) => date),
    now: vi.fn(() => new Date('2026-06-01T00:00:00.000Z')),
  },
  addDoc: firestore.addDoc,
  collection: vi.fn((_db, name: string) => ({ name })),
  deleteDoc: firestore.deleteDoc,
  doc: vi.fn((_db, collection: string, id: string) => ({ collection, id })),
  getDoc: firestore.getDoc,
  getDocs: firestore.getDocs,
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  updateDoc: firestore.updateDoc,
  where: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(() => ({
    currentUser: { uid: 'user-1', getIdToken: vi.fn().mockResolvedValue('firebase-id-token') },
  })),
  getFirestoreDb: vi.fn(() => ({ name: 'db' })),
  waitForAuth: vi.fn().mockResolvedValue(undefined),
}));

import {
  createPricingRequest,
  sendPricingRequest,
  updatePricingRequest,
} from '@/lib/services/pricing-requests';
import {
  calculateSubtotal,
  calculateTaxAmount,
  calculateTotalAmount,
  allocateLineItemTotals,
  PricingLineItem,
} from '@/lib/types/pricing';
import { TAX_RATE } from '@/lib/constants/pricing';

const items: PricingLineItem[] = [
  { id: 'line-1', description: 'Design', quantity: 2, unitPrice: 12_345 },
  { id: 'line-2', description: 'Build', quantity: 1, unitPrice: 7_654 },
];

describe('pricing proposal totals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    firestore.addDoc.mockResolvedValue({ id: 'proposal-1' });
    firestore.updateDoc.mockResolvedValue(undefined);
  });

  it('calculates subtotal and rounds VAT to the nearest cent', () => {
    expect(calculateSubtotal(items)).toBe(32_344);
    expect(calculateTaxAmount(32_344, 0.17)).toBe(5_498);
    expect(calculateTotalAmount(items, 0.17)).toBe(37_842);
  });

  it('uses the current optional Israeli VAT rate', () => {
    expect(TAX_RATE).toBe(0.18);
  });

  it('allocates proposal totals across request items without losing a cent', () => {
    const allocations = allocateLineItemTotals(items, calculateTotalAmount(items, TAX_RATE));

    expect(allocations.map(allocation => allocation.totalAmount)).toEqual([29_134, 9_032]);
    expect(allocations.reduce((sum, allocation) => sum + allocation.totalAmount, 0)).toBe(38_166);
  });

  it('persists the submitted VAT rate and total during creation', async () => {
    await createPricingRequest('org-1', 'user-1', 'Agency User', {
      title: 'Website proposal',
      lineItems: items.map(({ id: _id, ...item }) => item),
      currency: 'ILS',
      taxRate: 0.17,
    });

    expect(firestore.addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        taxRate: 0.17,
        totalAmount: 37_842,
        balanceDue: 37_842,
      })
    );
  });

  it('uses the stored VAT rate when an update omits taxRate', async () => {
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        status: 'DRAFT',
        taxRate: 0.17,
        totalAmount: 1_000,
        lineItems: items,
        amountPaid: 0,
      }),
    });

    await updatePricingRequest('proposal-1', { lineItems: items });

    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ totalAmount: 37_842, balanceDue: 37_842 })
    );
  });

  it.each(['ACCEPTED', 'PAID'] as const)('rejects updates after a proposal is %s', async status => {
    firestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ status }),
    });

    await expect(updatePricingRequest('proposal-1', { title: 'Changed' })).rejects.toThrow(
      'Accepted or paid proposals are locked'
    );
    expect(firestore.updateDoc).not.toHaveBeenCalled();
  });

  it('queues proposal delivery through the protected API instead of marking it sent client-side', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 202 }));

    await sendPricingRequest('proposal/1');

    expect(fetch).toHaveBeenCalledWith('/api/portal/proposals/proposal%2F1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer firebase-id-token',
      },
      body: JSON.stringify({ locale: 'en' }),
    });
    expect(firestore.updateDoc).not.toHaveBeenCalled();
  });
});
