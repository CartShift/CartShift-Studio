import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enforceApiRateLimit } from '@/lib/utils/api-rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 25;

const bodySchema = z.object({
  text: z.string().min(1).max(1600),
  locale: z.enum(['en', 'he']),
  token: z.string().regex(/^\d{10}\.[a-f0-9]{64}$/),
}).strict();

export async function POST(request: NextRequest) {
  const secret = process.env.YOTAM_ALIVE_VOICE_SIGNING_KEY;
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = process.env.ELEVENLABS_YOTAM_VOICE_ID;
  if (!secret || !key || !voice) return NextResponse.json({ error: 'Voice unavailable' }, { status: 503 });
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') || request.nextUrl.host;
  if (!origin || (() => { try { return new URL(origin).host !== host; } catch { return true; } })()) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }
  if (Number(request.headers.get('content-length') || 0) > 3500) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }
  let raw: unknown;
  try { raw = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid voice request' }, { status: 400 });
  const { text, locale, token } = parsed.data;
  const [exp, signature] = token.split('.');
  const expires = Number(exp);
  if (!Number.isSafeInteger(expires) || expires < Date.now() / 1000 || expires > Date.now() / 1000 + 120) {
    return NextResponse.json({ error: 'Voice token expired' }, { status: 403 });
  }
  const digest = createHash('sha256').update(text).digest('hex');
  const expected = createHmac('sha256', secret).update(`${exp}:${locale}:${digest}`).digest();
  const actual = Buffer.from(signature, 'hex');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: 'Invalid voice token' }, { status: 403 });
  }

  try {
    const limit = await enforceApiRateLimit(request, 'yotam-alive-voice', {
      maxRequests: 8, windowMs: 60 * 60 * 1000,
      tooManyRequestsMessage: 'Voice session limit reached.',
    });
    if ('response' in limit) return limit.response;
  } catch {
    return NextResponse.json({ error: 'Voice temporarily unavailable' }, { status: 503 });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
      signal: AbortSignal.timeout(18_000),
      cache: 'no-store',
    });
    if (!response.ok || !response.body) {
      return NextResponse.json({ error: 'Voice synthesis failed' }, { status: 502 });
    }
    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Voice temporarily unavailable' }, { status: 503 });
  }
}
