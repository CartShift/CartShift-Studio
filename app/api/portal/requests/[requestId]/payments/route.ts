import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAgencySession } from '@/lib/auth/server-agency';
import { createProposalInstallment, listProposalPayments } from '@/lib/services/proposals-server';
import { mapProposalError } from '@/lib/services/proposal-api-utils';
import { listRequestPayments } from '@/lib/services/request-billing-server';
import { mapRequestBillingError } from '@/lib/services/request-billing-api-utils';

const schema = z.object({
  label: z.string().trim().min(1).max(160),
  amount: z.number().int().min(1),
  dueAt: z.string().datetime().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    if (request.nextUrl.searchParams.get('schedule') === 'true') {
      await requireAgencySession();
      return NextResponse.json({ payments: await listProposalPayments(requestId) });
    }
    return NextResponse.json({ payments: await listRequestPayments(requestId) });
  } catch (error) {
    return request.nextUrl.searchParams.get('schedule') === 'true'
      ? mapProposalError(error)
      : mapRequestBillingError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await requireAgencySession();
    const { requestId } = await params;
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json({ error: 'Invalid installment request' }, { status: 400 });
    const payment = await createProposalInstallment(
      requestId,
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
