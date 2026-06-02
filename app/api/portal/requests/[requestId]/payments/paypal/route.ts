import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordVerifiedPayPalRequestPayment } from '@/lib/services/request-billing-server';
import { mapRequestBillingError } from '@/lib/services/request-billing-api-utils';

const schema = z.object({ orderId: z.string().trim().min(1).max(160) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await params;
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'INVALID_PAYPAL_ORDER' }, { status: 400 });
    return NextResponse.json({ payment: await recordVerifiedPayPalRequestPayment(requestId, parsed.data.orderId) }, { status: 201 });
  } catch (error) {
    return mapRequestBillingError(error);
  }
}
