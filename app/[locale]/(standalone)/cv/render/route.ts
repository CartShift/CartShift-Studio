import { NextResponse } from 'next/server';
import { POST as renderPost } from '@/app/api/cv/render/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const url = new URL(request.url);
  url.pathname = '/api/cv/render';

  return NextResponse.redirect(url, 307);
}

export async function POST(request: Request) {
  return renderPost(request);
}
