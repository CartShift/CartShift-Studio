import { NextRequest, NextResponse } from 'next/server';
import { getPrivateReportDeliveryStatus } from '@/lib/services/analysis-report-store';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!/^[A-Za-z0-9_-]{32}$/.test(token)) {
    return NextResponse.json({ error: 'Invalid report token' }, { status: 400 });
  }
  try {
    const status = await getPrivateReportDeliveryStatus(token);
    if (!status) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    return NextResponse.json({ status }, {
      headers: { 'Cache-Control': 'no-store, private' },
    });
  } catch {
    return NextResponse.json({ error: 'Report status unavailable' }, { status: 503 });
  }
}
