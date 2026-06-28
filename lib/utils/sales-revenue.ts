import { Request, REQUEST_STATUS } from '@/lib/types/portal';
import { PricingRequest, PRICING_STATUS } from '@/lib/types/pricing';

const PENDING_PAYMENT_REQUEST_STATUSES = new Set<string>([
  REQUEST_STATUS.ACCEPTED,
  REQUEST_STATUS.QUEUED,
  REQUEST_STATUS.IN_PROGRESS,
  REQUEST_STATUS.IN_REVIEW,
  REQUEST_STATUS.DELIVERED,
]);

export function getRecognizedRevenue(pricingRequest: PricingRequest): number {
  return (
    pricingRequest.amountPaid ??
    (pricingRequest.status === PRICING_STATUS.PAID ? pricingRequest.totalAmount || 0 : 0)
  );
}

export function getPricingRequestPendingAmount(pricingRequest: PricingRequest): number {
  if (pricingRequest.status !== PRICING_STATUS.ACCEPTED) return 0;
  return pricingRequest.balanceDue ?? pricingRequest.totalAmount ?? 0;
}

export function getRequestPendingAmount(request: Request): number {
  if (!request.isBillable || request.isFree || request.pricingOfferId) return 0;
  if (
    request.status === REQUEST_STATUS.CANCELED ||
    request.status === REQUEST_STATUS.CLOSED ||
    request.status === REQUEST_STATUS.DECLINED
  ) {
    return 0;
  }
  if (!PENDING_PAYMENT_REQUEST_STATUSES.has(request.status)) return 0;
  if (request.paymentStatus === 'paid') return 0;

  const balance = request.balanceDue ?? (request.totalAmount ?? 0) - (request.amountPaid ?? 0);
  return Math.max(0, balance);
}
