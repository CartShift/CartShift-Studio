import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAgencySession } from '@/lib/auth/server-agency';
import {
  createProposalInstallment,
  listProposalPayments,
} from '@/lib/services/proposals-server';
import { mapProposalError } from '@/lib/services/proposal-api-utils';

const installmentSchema = z.object({
  label: z.string().trim().min(1).max(160),
  amount: z.number().int().min(1),
  dueAt: z.string().datetime().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pricingId: string }> }
) {
  try {
    await requireAgencySession();
    const { pricingId } = await params;
    return NextResponse.json({ payments: await listProposalPayments(pricingId) });
  } catch (error) {
    return mapProposalError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pricingId: string }> }
) {
  try {
    const session = await requireAgencySession();
    const { pricingId } = await params;
    const parsed = installmentSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid installment request' }, { status: 400 });
    const payment = await createProposalInstallment(
      pricingId,
      {
        label: parsed.data.label,
        amount: parsed.data.amount,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
      },
      session.uid
    );
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return mapProposalError(error);
  }
}
