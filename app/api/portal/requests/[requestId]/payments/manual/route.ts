import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAgencySession } from '@/lib/auth/server-agency';
import { recordManualProposalPayment } from '@/lib/services/proposals-server';
import { mapProposalError } from '@/lib/services/proposal-api-utils';
import { recordManualRequestPayment } from '@/lib/services/request-billing-server';
import { mapRequestBillingError } from '@/lib/services/request-billing-api-utils';

const schema = z.object({
  label: z.string().trim().min(1).max(160),
  amount: z.number().int().min(1),
  method: z.enum([
    'bank_transfer',
    'cash',
    'bit',
    'paybox',
    'check',
    'credit_card_manual',
    'other',
  ]),
  reference: z.string().trim().max(160).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const body = await request.json().catch(() => null);
  try {
    const { requestId } = await params;
    if (body && typeof body === 'object' && 'label' in body) {
      const session = await requireAgencySession();
      const parsed = schema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json({ error: 'Invalid manual payment' }, { status: 400 });
      return NextResponse.json(
        { payment: await recordManualProposalPayment(requestId, parsed.data, session.uid) },
        { status: 201 }
      );
    }

    const direct = z
      .object({
        amount: z.number().int().min(1),
        method: z.enum(['bank_transfer', 'paypal', 'cash', 'bit', 'other']),
        reference: z.string().trim().max(160).optional(),
        notes: z.string().trim().max(500).optional(),
        paidAt: z.string().datetime().optional(),
      })
      .safeParse(body);
    if (!direct.success) return NextResponse.json({ error: 'INVALID_PAYMENT' }, { status: 400 });
    const payment = await recordManualRequestPayment(requestId, {
      ...direct.data,
      paidAt: direct.data.paidAt ? new Date(direct.data.paidAt) : undefined,
    });
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return body && typeof body === 'object' && 'label' in body
      ? mapProposalError(error)
      : mapRequestBillingError(error);
  }
}
