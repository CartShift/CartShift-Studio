import { NextResponse } from 'next/server';

export function mapRequestBillingError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Billing request failed';
  const status =
    message === 'UNAUTHENTICATED' ? 401 :
    message === 'FORBIDDEN' ? 403 :
    message === 'NOT_FOUND' ? 404 :
    ['INVALID_AMOUNT', 'INVALID_PAYPAL_ORDER', 'NOT_BILLABLE', 'PROPOSAL_MANAGED'].includes(message) ? 400 :
    500;
  return NextResponse.json({ error: message }, { status });
}
