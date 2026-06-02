import { NextRequest, NextResponse } from 'next/server';
import { listRequestPayments } from '@/lib/services/request-billing-server';
import { mapRequestBillingError } from '@/lib/services/request-billing-api-utils';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await params;
    return NextResponse.json({ payments: await listRequestPayments(requestId) });
  } catch (error) {
    return mapRequestBillingError(error);
  }
}
