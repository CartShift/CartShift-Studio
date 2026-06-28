import {
  ManualPaymentMethod,
  AgencyProposalPayment,
  PublicPricingProposal,
  PublicProposalPayment,
} from '@/lib/types/pricing';

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Proposal request failed');
  }
  return payload as T;
}

export async function getPublicProposalPayment(proposalToken: string, paymentToken: string) {
  return readJson<{ proposal: PublicPricingProposal; payment: PublicProposalPayment }>(
    await fetch(
      `/api/proposals/${encodeURIComponent(proposalToken)}/payments/${encodeURIComponent(paymentToken)}`,
      { cache: 'no-store' }
    )
  );
}

export async function createPublicProposalPayPalOrder(
  proposalToken: string,
  paymentToken: string
): Promise<string> {
  const payload = await readJson<{ orderId: string }>(
    await fetch(
      `/api/proposals/${encodeURIComponent(proposalToken)}/payments/${encodeURIComponent(paymentToken)}/paypal/order`,
      { method: 'POST' }
    )
  );
  return payload.orderId;
}

export async function capturePublicProposalPayPalOrder(
  proposalToken: string,
  paymentToken: string,
  orderId: string
) {
  return readJson<{ proposal: PublicPricingProposal; payment: PublicProposalPayment }>(
    await fetch(
      `/api/proposals/${encodeURIComponent(proposalToken)}/payments/${encodeURIComponent(paymentToken)}/paypal/capture`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      }
    )
  );
}

export async function issueProposalPublicToken(pricingId: string): Promise<string> {
  const payload = await readJson<{ token: string }>(
    await fetch(`/api/portal/requests/${encodeURIComponent(pricingId)}/public-link`, {
      method: 'POST',
    })
  );
  return payload.token;
}

export async function getProposalPayments(pricingId: string): Promise<AgencyProposalPayment[]> {
  const payload = await readJson<{ payments: AgencyProposalPayment[] }>(
    await fetch(`/api/portal/requests/${encodeURIComponent(pricingId)}/payments?schedule=true`, {
      cache: 'no-store',
    })
  );
  return payload.payments;
}

export async function createProposalInstallment(
  pricingId: string,
  input: { label: string; amount: number; dueAt?: string }
): Promise<AgencyProposalPayment> {
  const payload = await readJson<{ payment: AgencyProposalPayment }>(
    await fetch(`/api/portal/requests/${encodeURIComponent(pricingId)}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  );
  return payload.payment;
}

export async function cancelProposalInstallment(pricingId: string, paymentId: string) {
  await readJson<{ success: true }>(
    await fetch(
      `/api/portal/requests/${encodeURIComponent(pricingId)}/payments/${encodeURIComponent(paymentId)}`,
      { method: 'PATCH' }
    )
  );
}

export async function recordManualProposalPayment(
  pricingId: string,
  input: {
    label: string;
    amount: number;
    method: ManualPaymentMethod;
    reference?: string;
    note?: string;
  }
): Promise<PublicProposalPayment> {
  const payload = await readJson<{ payment: PublicProposalPayment }>(
    await fetch(`/api/portal/requests/${encodeURIComponent(pricingId)}/payments/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  );
  return payload.payment;
}
