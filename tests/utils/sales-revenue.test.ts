import { describe, expect, it } from 'vitest';
import { REQUEST_STATUS } from '@/lib/types/portal';
import { PRICING_STATUS } from '@/lib/types/pricing';
import {
  getPricingRequestPendingAmount,
  getRecognizedRevenue,
  getRequestPendingAmount,
} from '@/lib/utils/sales-revenue';

describe('sales revenue helpers', () => {
  it('counts accepted pricing proposals with outstanding balance', () => {
    expect(
      getPricingRequestPendingAmount({
        status: PRICING_STATUS.ACCEPTED,
        balanceDue: 50000,
        totalAmount: 100000,
      } as never)
    ).toBe(50000);
    expect(
      getPricingRequestPendingAmount({
        status: PRICING_STATUS.SENT,
        totalAmount: 100000,
      } as never)
    ).toBe(0);
  });

  it('counts standalone billable requests awaiting payment', () => {
    expect(
      getRequestPendingAmount({
        isBillable: true,
        status: REQUEST_STATUS.ACCEPTED,
        paymentStatus: 'unpaid',
        balanceDue: 169650,
        totalAmount: 169650,
        amountPaid: 0,
      } as never)
    ).toBe(169650);
  });

  it('excludes proposal-managed and unaccepted requests', () => {
    expect(
      getRequestPendingAmount({
        isBillable: true,
        status: REQUEST_STATUS.QUOTED,
        paymentStatus: 'unpaid',
        balanceDue: 169650,
      } as never)
    ).toBe(0);
    expect(
      getRequestPendingAmount({
        isBillable: true,
        status: REQUEST_STATUS.ACCEPTED,
        paymentStatus: 'unpaid',
        balanceDue: 169650,
        pricingOfferId: 'proposal-1',
      } as never)
    ).toBe(0);
  });

  it('uses partial balance for partially paid requests', () => {
    expect(
      getRequestPendingAmount({
        isBillable: true,
        status: REQUEST_STATUS.IN_PROGRESS,
        paymentStatus: 'partially_paid',
        balanceDue: 69650,
        totalAmount: 169650,
        amountPaid: 100000,
      } as never)
    ).toBe(69650);
  });

  it('recognizes paid pricing revenue from amountPaid or paid status', () => {
    expect(getRecognizedRevenue({ status: PRICING_STATUS.ACCEPTED, amountPaid: 25000 } as never)).toBe(
      25000
    );
    expect(
      getRecognizedRevenue({ status: PRICING_STATUS.PAID, totalAmount: 50000 } as never)
    ).toBe(50000);
  });
});
