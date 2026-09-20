import { GET as renderGet } from '@/app/api/cv/render/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const url = new URL(request.url);
  url.pathname = '/api/cv/render';

  const response = await renderGet(
    new Request(url, {
      method: 'GET',
      headers: request.headers,
    })
  );

  if (!response.ok) {
    return response;
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const disposition = response.headers.get('content-disposition') ?? '';
  const filenameMatch = disposition.match(/filename="([^"]+)"/);

  return Response.json(
    {
      filename: filenameMatch?.[1] ?? 'cv.pdf',
      mimeType: response.headers.get('content-type') ?? 'application/pdf',
      base64: bytes.toString('base64'),
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    }
  );
}
