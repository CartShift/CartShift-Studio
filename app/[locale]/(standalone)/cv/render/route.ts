import { GET as renderGet, POST as renderPost } from '@/app/api/cv/render/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  return renderGet(request);
}

export async function POST(request: Request) {
  return renderPost(request);
}
