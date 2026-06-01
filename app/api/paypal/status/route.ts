import { NextResponse } from 'next/server';
import { isPayPalServerConfigured } from '@/lib/services/paypal-server';

export async function GET() {
  return NextResponse.json({ available: isPayPalServerConfigured() });
}
