import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordManualRequestPayment } from '@/lib/services/request-billing-server';
import { mapRequestBillingError } from '@/lib/services/request-billing-api-utils';

const schema = z.object({
  amount: z.number().int().min(1),
  method: z.enum(['bank_transfer', 'paypal', 'cash', 'bit', 'other']),
  reference: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(500).optional(),
  paidAt: z.string().datetime().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await params;
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'INVALID_PAYMENT' }, { status: 400 });
    const payment = await recordManualRequestPayment(requestId, {
      ...parsed.data,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : undefined,
    });
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return mapRequestBillingError(error);
  }
}
