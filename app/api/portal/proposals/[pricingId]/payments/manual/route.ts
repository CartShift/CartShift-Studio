import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAgencySession } from '@/lib/auth/server-agency';
import { recordManualProposalPayment } from '@/lib/services/proposals-server';
import { mapProposalError } from '@/lib/services/proposal-api-utils';

const manualPaymentSchema = z.object({
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
  { params }: { params: Promise<{ pricingId: string }> }
) {
  try {
    const session = await requireAgencySession();
    const { pricingId } = await params;
    const parsed = manualPaymentSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid manual payment' }, { status: 400 });
    }
    const payment = await recordManualProposalPayment(pricingId, parsed.data, session.uid);
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return mapProposalError(error);
  }
}
