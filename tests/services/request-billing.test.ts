import { describe, expect, it } from 'vitest';
import {
  calculateRequestBillingTotals,
  canRecordRequestPayment,
  canUpdateBillingProfile,
  getDocumentTypeForRequest,
  recalculateRequestPaymentStatus,
  validateRequestPaymentAmount,
} from '@/lib/services/request-billing-server';
import { createPayPalOrderFromPricingRequest } from '@/lib/services/payment';

const request = {
  lineItems: [
    { id: 'support', description: 'Support', quantity: 1, unitPrice: 29000 },
    { id: 'fixes', description: 'Fixes', quantity: 3, unitPrice: 29000 },
    { id: 'checkout', description: 'Checkout', quantity: 1, unitPrice: 29000 },
  ],
  taxRate: 0.17,
};

describe('direct request billing', () => {
  it('calculates the Bizhu subtotal and rounded VAT in smallest currency units', () => {
    expect(calculateRequestBillingTotals(request)).toEqual({
      subtotal: 145000,
      taxRate: 0.17,
      taxAmount: 24650,
      totalAmount: 169650,
    });
  });

  it('reconciles partial and full payments', () => {
    const partial = recalculateRequestPaymentStatus(request, [{ id: 'a', amount: 100000, method: 'bank_transfer' }]);
    expect(partial).toMatchObject({ amountPaid: 100000, balanceDue: 69650, paymentStatus: 'partially_paid' });
    expect(recalculateRequestPaymentStatus(request, [{ id: 'b', amount: 169650, method: 'paypal' }])).toMatchObject({ balanceDue: 0, paymentStatus: 'paid' });
  });

  it('rejects overpayment and non-positive payment amounts', () => {
    expect(() => validateRequestPaymentAmount(10001, 10000)).toThrow('INVALID_AMOUNT');
    expect(() => validateRequestPaymentAmount(0, 10000)).toThrow('INVALID_AMOUNT');
  });

  it('uses safe document types for each payment state', () => {
    expect(getDocumentTypeForRequest({ paymentStatus: 'unpaid' })).toBe('payment_request');
    expect(getDocumentTypeForRequest({ paymentStatus: 'partially_paid' })).toBe('invoice');
    expect(getDocumentTypeForRequest({ paymentStatus: 'paid' })).toBe('payment_receipt');
  });

  it('enforces finance and settings role boundaries', () => {
    expect(canRecordRequestPayment('sales_manager')).toBe(true);
    expect(canRecordRequestPayment('developer')).toBe(false);
    expect(canUpdateBillingProfile('admin')).toBe(true);
    expect(canUpdateBillingProfile('sales_manager')).toBe(false);
  });

  it('adds VAT to the PayPal order breakdown', () => {
    const order = createPayPalOrderFromPricingRequest({
      id: 'bizhu',
      orgId: 'bizhu-org',
      title: 'Bizhu support',
      lineItems: request.lineItems,
      totalAmount: 169650,
      currency: 'ILS',
      status: 'ACCEPTED',
      createdBy: 'owner',
      createdByName: 'Owner',
      createdAt: {} as never,
      updatedAt: {} as never,
    });
    expect(order.purchase_units[0].amount.breakdown.tax_total?.value).toBe('246.50');
  });
});
