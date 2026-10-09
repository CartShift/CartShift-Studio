import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  payment: {} as Record<string, unknown>,
  proposal: {} as Record<string, unknown>,
  updates: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('firebase-admin', () => ({
  firestore: {
    FieldValue: { serverTimestamp: () => 'server-timestamp' },
  },
}));

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => ({
      doc: (id: string) => ({
        id, collectionName: name,
        // Skip materialization: this test verifies atomic ledger transitions.
        get: async () => ({ data: () => undefined }),
      }),
    }),
    runTransaction: async (run: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        get: async (ref: { collectionName: string }) => ({
          data: () => ref.collectionName === 'portal_payments'
            ? { ...state.payment }
            : { ...state.proposal },
        }),
        update: (ref: { collectionName: string }, changes: Record<string, unknown>) => {
          state.updates(ref.collectionName, changes);
          Object.assign(
            ref.collectionName === 'portal_payments' ? state.payment : state.proposal,
            changes,
          );
        },
      };
      return run(tx);
    },
  },
}));

import { reconcileProposalPayment } from '@/lib/services/proposals-server';

describe('transactional PayPal reconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.payment = {
      requestId: 'req-1', orgId: 'org-a', amount: 60,
      status: 'pending', provider: 'paypal',
    };
    state.proposal = {
      orgId: 'org-a', totalAmount: 100,
      amountPaid: 0, pendingAmount: 60, balanceDue: 100,
      status: 'ACCEPTED', paymentStatus: 'pending',
    };
  });

  it('adds a capture only once and ignores duplicated success/denial callbacks', async () => {
    await reconcileProposalPayment({ paymentId: 'pay-1', captureId: 'cap-1', status: 'paid' });
    expect(state.payment.status).toBe('paid');
    expect(state.proposal.amountPaid).toBe(60);
    expect(state.proposal.balanceDue).toBe(40);
    const updates = state.updates.mock.calls.length;

    await reconcileProposalPayment({ paymentId: 'pay-1', captureId: 'cap-1', status: 'paid' });
    await reconcileProposalPayment({ paymentId: 'pay-1', captureId: 'cap-1', status: 'failed' });
    expect(state.updates).toHaveBeenCalledTimes(updates);
    expect(state.proposal.amountPaid).toBe(60);
    expect(state.proposal.balanceDue).toBe(40);
  });

  it('subtracts a refund exactly once, and ignores a delayed capture', async () => {
    await reconcileProposalPayment({ paymentId: 'pay-1', captureId: 'cap-1', status: 'paid' });
    await reconcileProposalPayment({ paymentId: 'pay-1', captureId: 'cap-1', status: 'refunded' });
    expect(state.payment.status).toBe('refunded');
    expect(state.proposal.amountPaid).toBe(0);
    expect(state.proposal.balanceDue).toBe(100);
    const updates = state.updates.mock.calls.length;

    await reconcileProposalPayment({ paymentId: 'pay-1', captureId: 'cap-1', status: 'refunded' });
    await reconcileProposalPayment({ paymentId: 'pay-1', captureId: 'cap-1', status: 'paid' });
    expect(state.updates).toHaveBeenCalledTimes(updates);
    expect(state.proposal.amountPaid).toBe(0);
  });

  it('permits valid failed-to-paid recovery without going negative', async () => {
    await reconcileProposalPayment({ paymentId: 'pay-1', status: 'failed' });
    expect(state.payment.status).toBe('failed');
    expect(state.proposal.pendingAmount).toBe(0);
    await reconcileProposalPayment({ paymentId: 'pay-1', captureId: 'cap-1', status: 'paid' });
    expect(state.payment.status).toBe('paid');
    expect(state.proposal.amountPaid).toBe(60);
    expect(state.proposal.pendingAmount).toBe(0);
    expect(state.proposal.balanceDue).toBe(40);
  });
});
